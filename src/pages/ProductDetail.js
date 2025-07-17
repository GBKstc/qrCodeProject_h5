import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productData, setProductData] = useState(null);
  const [showConfig, setShowConfig] = useState([]);
  
  // 从URL参数获取qrcodeId
  const qrcodeId = searchParams.get('qrcodeId');

  useEffect(() => {
    if (!qrcodeId) {
      setError('缺少必要参数 qrcodeId');
      setLoading(false);
      return;
    }

    loadData();
  }, [qrcodeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 并行获取产品详情和展示配置
      const [productResponse, configResponse] = await Promise.all([
        scanAPI.getByQrCode(parseInt(qrcodeId)),
        scanAPI.getShowConfig()
      ]);
      
      if (productResponse.data.success) {
        setProductData(productResponse.data.data);
      } else {
        setError(productResponse.data.message || '获取产品详情失败');
        return;
      }
      
      if (configResponse.data.success) {
        // 只保留需要显示的字段配置
        const visibleFields = configResponse.data.data.records.filter(item => item.isShow === 1);
        setShowConfig(visibleFields);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadData();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    try {
      return new Date(dateTimeStr).toLocaleString('zh-CN');
    } catch {
      return dateTimeStr;
    }
  };

  // 字段映射配置
  const fieldMapping = {
    // 'qrcodeUrl': {
    //   label: '二维码',
    //   getValue: (data) => data.qrcodeUrl,
    //   render: (value) => value ? (
    //     <div className="qrcode-display">
    //       <img src={value} alt="二维码" className="qrcode-image" />
    //     </div>
    //   ) : '-'
    // },
    'trademark': {
      label: '商标',
      getValue: (data) => data.trademark,
      render: (value) => value ? (
        <img 
          src={value} 
          alt="商标" 
          className="trademark-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline';
          }}
        />
      ) : '-'
    },
    'batchCode': {
      label: '批次',
      getValue: (data) => data.batchCode,
      render: (value) => value || '-'
    },
    // 'qrcodeCode': {
    //   label: '二维码编号',
    //   getValue: (data) => data.qrcodeId,
    //   render: (value) => value || '-'
    // },
    'shareProductTime': {
      label: '生产时间',
      getValue: (data) => data.shareProductTime,
      render: (value) => formatDateTime(value)
    },
    'thumbCode': {
      label: '生产图号',
      getValue: (data) => data.thumbCode,
      render: (value) => value || '-'
    },
    'size': {
      label: '产品型号',
      getValue: (data) => data.size,
      render: (value) => value || '-'
    }
  };

  // 根据配置渲染字段
  const renderConfiguredFields = () => {
    if (!showConfig.length || !productData) return null;

    return showConfig.map((config) => {
      const fieldConfig = fieldMapping[config.code];
      if (!fieldConfig) return null;

      const value = fieldConfig.getValue(productData);
      
      return (
        <div key={config.id} className="display-item">
          <div className="display-label">{config.name}:</div>
          <div className="display-value">
            {fieldConfig.render(value)}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在获取产品详情...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
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
    <div className="product-detail-container">
      <div className="product-detail-content">
        <div className="header">
          <button onClick={handleBack} className="back-button">
            ← 返回
          </button>
          <h2>产品详情</h2>
        </div>

        {productData && (
          <div className="product-info">
            {/* 动态显示配置的字段 */}
            <div className="display-section">
              <div className="display-grid">
                {renderConfiguredFields()}
              </div>
            </div>

            {/* 产品缩略图 */}
            {productData.productThumb && (
              <div className="product-thumb-section">
                <div className="product-thumb">
                  <img src={productData.productThumb} alt="产品缩略图" />
                </div>
              </div>
            )}

            {/* 生产记录 */}
            {productData.produceUserList && productData.produceUserList.length > 0 && (
              <div className="info-section">
                <h3>生产记录 ({productData.produceUserList.length}条)</h3>
                <div className="user-list">
                  {productData.produceUserList.map((user, index) => (
                    <div key={user.id || index} className="user-item">
                      <div className="user-header">
                        <span className="user-name">{user.operateName || '未知操作员'}</span>
                        <span className="user-process">{user.productionProcessesName || '-'}</span>
                      </div>
                      <div className="user-details">
                        <div className="user-detail">
                          <span>操作员ID: {user.operateId || '-'}</span>
                        </div>
                        <div className="user-detail">
                          <span>工序ID: {user.productionProcessesId || '-'}</span>
                        </div>
                        <div className="user-detail">
                          <span>创建时间: {formatDateTime(user.createTime)}</span>
                        </div>
                        {/* {user.remark && (
                          <div className="user-detail">
                            <span>备注: {user.remark}</span>
                          </div>
                        )} */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 备注信息 */}
            {/* {productData.remark && (
              <div className="info-section">
                <h3>备注</h3>
                <div className="remark-content">
                  {productData.remark}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;