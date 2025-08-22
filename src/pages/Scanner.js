import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';
import { useToast } from '../components/Toast';
import './Scanner.css';

const Scanner = () => {
  const navigate = useNavigate();
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [selectionData, setSelectionData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();
  const inputRef = useRef(null);

  // 添加useEffect来获取保存的选择数据
  useEffect(() => {
    // 从localStorage获取选择数据
    const savedSelectionData = localStorage.getItem('currentSelectionData');
    const savedScanHistory = localStorage.getItem('scanHistory');
    
    if (savedSelectionData) {
      try {
        const parsedData = JSON.parse(savedSelectionData);
        setSelectionData(parsedData);
        console.log('获取到的选择数据:', parsedData);
      } catch (error) {
        console.error('解析选择数据失败:', error);
        // 如果没有选择数据，跳转回工序选择页面
        navigate('/process-selection');
      }
    } else {
      console.warn('未找到选择数据，跳转到工序选择页面');
      navigate('/process-selection');
    }
    
    if (savedScanHistory) {
      try {
        const parsedHistory = JSON.parse(savedScanHistory);
        setScanHistory(parsedHistory);
      } catch (error) {
        console.error('解析扫码历史失败:', error);
      }
    }
  }, [navigate]);

  // 自动获取焦点
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 监听键盘事件，支持左右键触发确认输入
  // useEffect(() => {
  //   const handleKeyDown = (event) => {
  //     // 检测左键或右键
  //     if (event.key === 'Unidentified') {
  //       event.preventDefault();
  //       handleManualSubmit();
  //     }
  //   };

  //   // 添加事件监听器
  //   document.addEventListener('keydown', handleKeyDown);

  //   // 清理函数
  //   return () => {
  //     document.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [manualInput, selectionData, isSubmitting]); // 依赖项确保函数能访问最新状态

  // 添加历史记录到localStorage的函数
  const addToHistory = (code, method = '二维码详情') => {
    const newRecord = {
      id: Date.now(),
      code,
      method,
      timestamp: new Date().toLocaleString('zh-CN')
    };
    
    const updatedHistory = [newRecord, ...scanHistory].slice(0, 50); // 最多保存50条记录
    setScanHistory(updatedHistory);
    localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
  };

  const handleManualSubmit = async (inputValue) => {

    if (!inputValue.trim()) {
      showWarning('请输入二维码内容');
      return;
    }
    
    if (!selectionData) {
      showError('选择数据丢失，请重新选择工序信息');
      navigate('/process-selection');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 解析URL中的qrcodeId参数
      let qrcodeId = 0;
      const input = manualInput.trim();
      
      // 检查是否是URL格式
      if (input.includes('qrcodeId=')) {
        try {
          const url = new URL(input);
          const qrcodeIdParam = url.searchParams.get('qrcodeId');
          qrcodeId = parseInt(qrcodeIdParam) || 0;
        } catch (urlError) {
          // 如果URL解析失败，尝试正则表达式提取
          const qrcodeIdMatch = input.match(/qrcodeId=(\d+)/);
          qrcodeId = qrcodeIdMatch ? parseInt(qrcodeIdMatch[1]) : 0;
        }
      } else {
        // 如果不是URL格式，直接尝试转换为数字
        qrcodeId = parseInt(input) || 0;
      }
      
      const requestData = {
        // deviceId: selectionData.device?.id || 0,
        productId: selectionData.product?.id || 0,
        productionProcessesId: selectionData.process?.id || 0,
        qrcodeId: qrcodeId
      };
      
      console.log('解析的qrcodeId:', qrcodeId);
      console.log('提交的请求数据:', requestData);
      
      const response = await scanAPI.take(requestData);
      
      if (response.data.success) {
        setScannedCode(manualInput.trim());
        addToHistory(manualInput.trim(), '二维码详情');
        setManualInput('');
        showSuccess('提交成功！');
      } else {
        setManualInput('');
        showError(response.data.message || '提交失败，请重试');
      }
      
    } catch (error) {
      console.error('提交失败:', error);
      showError(`提交失败，请检查网络连接或稍后重试${JSON.stringify(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('scanHistory');
    setScanHistory([]);
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        // alert('已复制到剪贴板');
      }).catch(() => {
        // alert('复制失败');
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        // alert('已复制到剪贴板');
      } catch (err) {
        // alert('复制失败');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <div className="page-content">
        <div className="card mb-20">
          <div className="card-header">
            <h3>二维码详情</h3>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input
                // defaultValue={'http://175.24.15.119:91/qrcode?qrcodeId=7&qrcode=7WTN0'}
                ref={inputRef}
                type="text"
                className="form-input"
                value={manualInput}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setManualInput(inputValue);
                  
                  // 检查输入内容是否符合指定的URL格式
                  const isValidQRCodeUrl = (url) => {
                    try {
                      const urlObj = new URL(url);
                      const params = new URLSearchParams(urlObj.search);
                      const qrcodeId = params.get('qrcodeId');
                      const qrcode = params.get('qrcode');
                      
                      // 检查是否包含qrcodeId和qrcode参数，且qrcode长度>=5
                      return qrcodeId && qrcode && qrcode.length >= 5;
                    } catch {
                      return false;
                    }
                  };
                  
                  // 如果输入内容符合格式，自动触发提交
                  if (isValidQRCodeUrl(inputValue) && !isSubmitting) {
                    console.log('检测到有效的二维码URL，自动提交:', inputValue);
                    // 使用setTimeout确保状态更新完成后再触发提交
                    setTimeout(() => {
                      handleManualSubmit(inputValue);

                    }, 100);
                  }
                }}
                placeholder="请输入二维码内容或产品编号"
                disabled={isSubmitting}
              />
              <button 
                className="btn btn-secondary"
                onClick={handleManualSubmit.bind(this,manualInput)}

                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '确认输入'}
              </button>
            </div>
          </div>
        </div>

        {scannedCode && (
          <div className="card mb-20">
            <div className="card-header">
              <h3>最新扫码结果</h3>
            </div>
            <div className="card-body">
              <div className="result-display">
                <div className="result-code">{scannedCode}</div>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => copyToClipboard(scannedCode)}
                >
                  复制
                </button>
              </div>
            </div>
          </div>
        )}

        {scanHistory.length > 0 && (
          <div className="card">
            <div className="card-header flex-between">
              <h3>扫码历史 ({scanHistory.length})</h3>
              <button 
                className="btn btn-secondary btn-small"
                onClick={clearHistory}
              >
                清空历史
              </button>
            </div>
            <div className="card-body">
              <div className="history-list">
                {scanHistory.map(record => (
                  <div key={record.id} className="history-item">
                    <div className="history-content">
                      <div className="history-code">{record.code}</div>
                      <div className="history-meta">
                        <span className={`method ${record.method === '扫码' ? 'scan' : 'manual'}`}>
                          {record.method}
                        </span>
                        <span className="time">{record.timestamp}</span>
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => copyToClipboard(record.code)}
                    >
                      复制
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;