import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';
import './Scanner.css';

const Scanner = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isLightOn, setIsLightOn] = useState(false);
  const [selectionData, setSelectionData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    // 获取选择的数据
    const savedData = localStorage.getItem('currentSelectionData');
    if (savedData) {
      try {
        setSelectionData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse selection data:', error);
      }
    }

    // 获取扫码历史
    const history = localStorage.getItem('scanHistory');
    if (history) {
      try {
        setScanHistory(JSON.parse(history));
      } catch (error) {
        console.error('Failed to parse scan history:', error);
      }
    }

    // 监听来自安卓的扫码结果
    const handleScanResult = (event) => {
      if (event.data && event.data.type === 'SCAN_RESULT') {
        const scanResult = event.data.result;
        if (scanResult) {
          setManualInput(scanResult);
          // 震动反馈
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
      }
    };

    // 监听安卓消息
    window.addEventListener('message', handleScanResult);
    
    return () => {
      window.removeEventListener('message', handleScanResult);
    };
  }, []);

  // 检查是否在安卓WebView环境中
  const isAndroidWebView = () => {
    return window.AndroidInterface || window.webkit?.messageHandlers?.AndroidInterface;
  };

  // 调用安卓原生扫码功能
  const callAndroidScan = () => {
    try {
      if (window.AndroidInterface && window.AndroidInterface.startScan) {
        // 安卓原生接口
        window.AndroidInterface.startScan();
        return true;
      } else if (window.webkit?.messageHandlers?.AndroidInterface) {
        // iOS WebKit接口（如果需要兼容）
        window.webkit.messageHandlers.AndroidInterface.postMessage({
          action: 'startScan'
        });
        return true;
      }
    } catch (error) {
      console.error('调用原生扫码失败:', error);
    }
    return false;
  };

  // 调用安卓原生闪光灯功能
  const callAndroidFlashlight = (enable) => {
    try {
      if (window.AndroidInterface && window.AndroidInterface.setFlashlight) {
        window.AndroidInterface.setFlashlight(enable);
        return true;
      } else if (window.webkit?.messageHandlers?.AndroidInterface) {
        window.webkit.messageHandlers.AndroidInterface.postMessage({
          action: 'setFlashlight',
          enable: enable
        });
        return true;
      }
    } catch (error) {
      console.error('调用原生闪光灯失败:', error);
    }
    return false;
  };

  const generateMockQRCode = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QR${timestamp}${random}`;
  };

  const handleScan = async () => {
    setIsScanning(true);
    
    try {
      // 优先使用安卓原生扫码
      if (isAndroidWebView() && callAndroidScan()) {
        console.log('调用安卓原生扫码');
        // 原生扫码结果会通过message事件返回
      } else {
        // 降级到模拟扫码
        console.log('使用模拟扫码');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockQRCode = generateMockQRCode();
        setManualInput(mockQRCode);
        
        // 震动反馈
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('扫码失败，请重试');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      alert('请输入代码');
      return;
    }
    
    if (!selectionData) {
      alert('请先选择工序信息');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 构建请求参数
      const requestData = {
        deviceId: selectionData.device?.id || 0,
        productId: selectionData.product?.id || 0,
        productionProcessesId: selectionData.process?.id || 0,
        qrcodeId: parseInt(manualInput.trim()) || 0
      };
      
      console.log('提交扫码数据:', requestData);
      
      // 调用扫码接口
      const response = await scanAPI.take(requestData);
      
      if (response.data.success) {
        setScannedCode(manualInput.trim());
        addToHistory(manualInput.trim(), '手动输入');
        setManualInput('');
        alert('提交成功！');
      } else {
        alert(response.data.message || '提交失败，请重试');
      }
      
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请检查网络连接或稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToHistory = (code, method) => {
    const newRecord = {
      id: Date.now(),
      code,
      method,
      timestamp: new Date().toLocaleString('zh-CN'),
      selectionData: selectionData ? {
        process: selectionData.process?.name,
        device: selectionData.device?.name,
        product: selectionData.product?.name,
        batch: selectionData.batch?.name
      } : null
    };
    
    const updatedHistory = [newRecord, ...scanHistory].slice(0, 20);
    setScanHistory(updatedHistory);
    localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
  };

  const toggleLight = () => {
    const newLightState = !isLightOn;
    
    // 优先使用安卓原生闪光灯
    if (isAndroidWebView() && callAndroidFlashlight(newLightState)) {
      console.log(`安卓原生闪光灯${newLightState ? '开启' : '关闭'}`);
      setIsLightOn(newLightState);
    } else {
      // 降级到模拟闪光灯
      console.log(`模拟闪光灯${newLightState ? '开启' : '关闭'}`);
      setIsLightOn(newLightState);
      
      // 可以尝试使用Web API（如果支持）
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 这里可以尝试访问摄像头并控制闪光灯
        // 但Web API对闪光灯的支持有限
      }
    }
  };

  const goBack = () => {
    navigate('/process-selection');
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空扫码历史吗？')) {
      setScanHistory([]);
      localStorage.removeItem('scanHistory');
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板');
      }).catch(() => {
        alert('复制失败');
      });
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('已复制到剪贴板');
      } catch (err) {
        alert('复制失败');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={goBack}>
          ← 返回
        </button>
        <span>扫码页面</span>
        <div className="env-indicator">
          {isAndroidWebView() ? '🤖 原生' : '🌐 Web'}
        </div>
      </div>

      {selectionData && (
        <div className="page-content">
          <div className="card mb-20">
            <div className="card-header">
              <h3>当前工序信息</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">工序：</span>
                  <span className="value">{selectionData.process?.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">设备：</span>
                  <span className="value">{selectionData.device?.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">产品：</span>
                  <span className="value">{selectionData.product?.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">批次：</span>
                  <span className="value">{selectionData.batch?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="card mb-20">
          <div className="card-header">
            <h3>扫码区域</h3>
          </div>
          <div className="card-body text-center">
            <div className="scanner-area" ref={scannerRef}>
              <div className={`qr-frame ${isScanning ? 'scanning' : ''}`}>
                <div className="scan-line"></div>
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
                {isScanning && (
                  <div className="scanning-text">扫码中...</div>
                )}
              </div>
              <p className="scan-tip">将二维码放入框内进行扫描</p>
            </div>

            <div className="control-buttons">
              <button 
                className="btn btn-primary scan-btn"
                onClick={handleScan}
                disabled={isScanning}
              >
                📷 {isScanning ? '扫码中...' : (isAndroidWebView() ? '原生扫码' : '模拟扫码')}
              </button>
              
              <button 
                className={`btn ${isLightOn ? 'btn-warning' : 'btn-secondary'} light-btn`}
                onClick={toggleLight}
              >
                💡 {isLightOn ? '关闭' : '开启'}闪光灯
              </button>
            </div>
          </div>
        </div>

        <div className="card mb-20">
          <div className="card-header">
            <h3>手动输入</h3>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input
                type="text"
                className="form-input"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="请输入二维码内容或产品编号"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
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