import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { qrcodeAPI } from '../services/api';
import './QRCodeDetail.css';

const QRCodeDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState(null);
  
  // 从URL参数获取qrid和qrcode
  const qrid = searchParams.get('qrid');
  const qrcode = searchParams.get('qrcode');

  useEffect(() => {
    if (!qrid) {
      setError('缺少必要参数 qrid');
      setLoading(false);
      return;
    }

    loadQRCodeDetail();
  }, [qrid]);

  const loadQRCodeDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await qrcodeAPI.getDetail(qrid);
      // const response = {
      //   data:{
      //     "code": "",
      //     "data": {
      //       "batchCode": "",
      //       "code": "",
      //       "createTime": "",
      //       "deviceId": 0,
      //       "id": 0,
      //       "num": 0,
      //       "operateId": 0,
      //       "operateName": "",
      //       "remark": "",
      //       "sort": 0,
      //       "status": 0,
      //       "updateTime": "",
      //       "url": "/product-detail"
      //     },
      //     "message": "",
      //     "reason": {
      //       "errMsg": "",
      //       "exFrom": ""
      //     },
      //     "success": true
      //   }
      // }
      if (response.data.success) {
        setQrData(response.data.data);
        
        // 如果返回的数据中有url字段，自动跳转到对应的页面
        if (response.data.data.url) {
          handleManualJump(response.data.data.url);
        }
      } else {
        setError(response.data.message || '获取二维码详情失败');
      }
    } catch (err) {
      console.error('获取二维码详情失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadQRCodeDetail();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleManualJump = (url) => {
    if (url) {
      // 判断是否是完整的URL地址（以http://或https://开头）
      const hasProtocol = /^https?:\/\//i.test(url);
      
      // 如果不是完整地址，则添加https://前缀
      const fullUrl = hasProtocol ? url : `https://${url}`;
      //如果是 /product-detail 产品详情展示地址，需要跳转到产品详情页 参数qrcodeId 
      if(fullUrl.indexOf('/product-detail') !== -1){
        window.location.href = '/product-detail?qrcodeId=' + qrid;
        return;
      }
      // 跳转到目标地址
      window.location.href = fullUrl;
    }
  };

  if (loading) {
    return (
      <div className="qrcode-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在获取二维码详情...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qrcode-detail-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>获取失败</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-btn">
              重试
            </button>
            <button onClick={handleBack} className="back-btn">
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qrcode-detail-container">
      {/* <div className="qrcode-detail-content">
        <div className="header">
          <button onClick={handleBack} className="back-button">
            ← 返回
          </button>
          <h2>二维码详情</h2>
        </div>

        <div className="qr-info">
          <div className="qr-params">
            <h3>扫码信息</h3>
            <div className="param-item">
              <span className="param-label">二维码ID:</span>
              <span className="param-value">{qrid}</span>
            </div>
            <div className="param-item">
              <span className="param-label">二维码内容:</span>
              <span className="param-value">{qrcode}</span>
            </div>
          </div>

          {qrData && (
            <div className="qr-details">
              <h3>详细信息</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">批次代码:</span>
                  <span className="detail-value">{qrData.batchCode || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">代码:</span>
                  <span className="detail-value">{qrData.code || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">设备ID:</span>
                  <span className="detail-value">{qrData.deviceId || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">数量:</span>
                  <span className="detail-value">{qrData.num || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">操作员ID:</span>
                  <span className="detail-value">{qrData.operateId || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">操作员姓名:</span>
                  <span className="detail-value">{qrData.operateName || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态:</span>
                  <span className="detail-value">{qrData.status || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">创建时间:</span>
                  <span className="detail-value">{qrData.createTime || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新时间:</span>
                  <span className="detail-value">{qrData.updateTime || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">备注:</span>
                  <span className="detail-value">{qrData.remark || '-'}</span>
                </div>
              </div>

              {qrData.url && (
                <div className="jump-section">
                  <h3>跳转信息</h3>
                  <div className="url-info">
                    <p>目标URL: <span className="url-text">{qrData.url}</span></p>
                    <p className="auto-jump-notice">⏰ 系统将在2秒后自动跳转</p>
                    <button onClick={() => handleManualJump(qrData.url)} className="manual-jump-btn">
                      立即跳转
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default QRCodeDetail;