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
  const qrcode = searchParams.get('qrcode');


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
    // navigate(-1);
    //https://www.insulators.cn
    window.location.href = 'https://www.insulators.cn';
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
    // 'trademark': {
    //   label: '商标',
    //   getValue: (data) => data.trademark,
    //   render: (value) => value ? (
    //     <img 
    //       src={value} 
    //       alt="商标" 
    //       className="trademark-image"
    //       onError={(e) => {
    //         e.target.style.display = 'none';
    //         e.target.nextSibling.style.display = 'inline';
    //       }}
    //     />
    //   ) : '-'
    // },
    'batchCode': {
      label: '批次',
      getValue: (data) => data.shareBatchCode,
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
        {/* 海报风格头部 */}
        <div className="poster-header">
          <div className="header-background">
            <div className="header-overlay"></div>
            <div className="header-content">
              <button className="back-button" onClick={handleBack}>
                <span className="back-icon">←</span>
                <span>返回</span>
              </button>
              <div className="header-title">
                <h1 className="main-title">产品详情</h1>
                <div className="title-decoration"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 海报风格产品展示区 */}
        {productData && (
          <div className="poster-hero-section">
            <div className="hero-background">
              <div className="hero-pattern"></div>
              <div className="hero-content">
                <div className="product-showcase">
                  <div className="product-badge">PREMIUM</div>
                  <h1 className="hero-product-name">{productData.productName || '未知产品'}</h1>
                  <div className="product-tagline">正品保证 · 品质之选</div>
                  
                  <div className="qr-hero-section">
                    <div className="qr-label-container">
                      <span className="qr-label">追溯防伪码</span>
                      <div className="qr-decoration"></div>
                    </div>
                    <div className="qr-code-display">
                      <span className="qr-number">{qrcode}</span>
                      <div className="qr-glow"></div>
                    </div>
                  </div>
                </div>
                
                {/* 产品缩略图海报展示 */}
                {productData.productThumb && (
                  <div className="hero-image-section">
                    <div className="image-frame">
                      <img 
                        src={productData.productThumb} 
                        alt="产品展示" 
                        className="hero-product-image"
                      />
                      <div className="image-overlay">
                        <span className="image-label">PRODUCT</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {productData && (
          <div className="product-info">
            {/* 海报风格信息展示区 */}
            <div className="poster-info-section">
              <div className="info-container">
                <div className="section-title-container">
                  <h2 className="section-title">产品信息</h2>
                  <div className="title-underline"></div>
                </div>
                
                <div className="info-cards-grid">
                  {renderConfiguredFields().map((field, index) => (
                    <div key={index} className="info-card">
                      <div className="card-header">
                        <div className="card-icon"></div>
                        <span className="card-label">{field.props.children[0].props.children}</span>
                      </div>
                      <div className="card-content">
                        <span className="card-value">{field.props.children[1].props.children}</span>
                      </div>
                      <div className="card-decoration"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 海报风格生产记录区 */}
            {productData.produceUserList && productData.produceUserList.length > 0 && (
              <div className="poster-records-section">
                <div className="records-container">
                  <div className="records-header">
                    <div className="records-title-container">
                      <h2 className="records-title">生产记录</h2>
                      <div className="records-subtitle">Production Records</div>
                    </div>
                    <div className="records-count">
                      <span className="count-number">{productData.produceUserList.length}</span>
                      <span className="count-label">条记录</span>
                    </div>
                  </div>
                  
                  <div className="records-timeline">
                    {productData.produceUserList.map((user, index) => (
                      <div key={user.id || index} className="timeline-item">
                        <div className="timeline-marker">
                          <div className="marker-dot"></div>
                          <div className="marker-line"></div>
                        </div>
                        
                        <div className="timeline-content">
                          <div className="record-card">
                            <div className="record-header">
                              <div className="user-avatar">
                                <span className="avatar-text">{(user.operateName || '未知操作员').charAt(0)}</span>
                              </div>
                              <div className="user-info">
                                <h3 className="user-name">{user.operateName || '未知操作员'}</h3>
                                <p className="user-id">ID: {user.operateId || '-'}</p>
                              </div>
                              <div className="process-badge">
                                <span className="process-name">{user.productionProcessesName || '-'}</span>
                              </div>
                            </div>
                            
                            <div className="record-details">
                              <div className="detail-row">
                                <span className="detail-label">工序ID</span>
                                <span className="detail-value">{user.productionProcessesId || '-'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">创建时间</span>
                                <span className="detail-value">{formatDateTime(user.createTime)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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