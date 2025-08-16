import React, { useState, useEffect } from 'react';
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

  // 添加历史记录到localStorage的函数
  const addToHistory = (code, method = '手动输入') => {
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

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
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
      // 解析URL中的qrid参数
      let qrcodeId = 0;
      const input = manualInput.trim();
      
      // 检查是否是URL格式
      if (input.includes('qrid=')) {
        try {
          const url = new URL(input);
          const qridParam = url.searchParams.get('qrid');
          qrcodeId = parseInt(qridParam) || 0;
        } catch (urlError) {
          // 如果URL解析失败，尝试正则表达式提取
          const qridMatch = input.match(/qrid=(\d+)/);
          qrcodeId = qridMatch ? parseInt(qridMatch[1]) : 0;
        }
      } else {
        // 如果不是URL格式，直接尝试转换为数字
        qrcodeId = parseInt(input) || 0;
      }
      
      const requestData = {
        deviceId: selectionData.device?.id || 0,
        productId: selectionData.product?.id || 0,
        productionProcessesId: selectionData.process?.id || 0,
        qrcodeId: qrcodeId
      };
      
      console.log('解析的qrcodeId:', qrcodeId);
      console.log('提交的请求数据:', requestData);
      
      const response = await scanAPI.take(requestData);
      
      if (response.data.success) {
        setScannedCode(manualInput.trim());
        addToHistory(manualInput.trim(), '手动输入');
        setManualInput('');
        showSuccess('提交成功！');
      } else {
        showError(response.data.message || '提交失败，请重试');
      }
      
    } catch (error) {
      console.error('提交失败:', error);
      showError('提交失败，请检查网络连接或稍后重试');
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
            <h3>手动输入</h3>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input
                // defaultValue={'http://175.24.15.119:91/qrcode?qrid=7&qrcode=7WTN0'}
                type="text"
                className="form-input"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="请输入二维码内容或产品编号"
                disabled={isSubmitting}
              />
              <button 
                className="btn btn-secondary"
                onClick={handleManualSubmit}
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