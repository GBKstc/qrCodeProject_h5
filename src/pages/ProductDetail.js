import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';
import './ProductDetail.css';
import headerImage from '../images/header.jpg';
import bottomImage from '../images/bottom.png';

const ProductDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productData, setProductData] = useState(null);
  const [showConfig, setShowConfig] = useState([]);
  
  // 从URL参数获取qrid
  const qrid = searchParams.get('qrid');
  const qrcode = searchParams.get('qrcode');


  useEffect(() => {
    if (!qrid) {
      setError('缺少必要参数 qrid');
      setLoading(false);
      return;
    }

    loadData();
  }, [qrid]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 并行获取产品详情和展示配置
      const [productResponse, configResponse] = await Promise.all([
        scanAPI.getByQrCode(parseInt(qrid)),
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
    //   getValue: (data) => data.qrid,
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
      {/* 顶部图片 */}
      <div className="header-image-container">
        <img src={headerImage} alt="顶部图片" className="header-image" />
      </div>
      
      <div className="product-detail-content">
        {/* 第一部分：顶部产品名称 */}
        {productData && (
          <div className="product-header">
            <h1 className="product-name">{productData.productName || '未知产品'}</h1>
          </div>
        )}

        {/* 第二部分：产品参数表格 */}
        {productData && showConfig.length > 0 && (
          <div className="product-params-section">
            <h2 className="section-title">产品参数</h2>
            <div className="params-table">
              <table className="product-table">
                <tbody>
                  {showConfig.map((config) => {
                    const fieldConfig = fieldMapping[config.code];
                    if (!fieldConfig) return null;
                    
                    const value = fieldConfig.getValue(productData);
                    const renderedValue = fieldConfig.render(value);
                    
                    return (
                      <tr key={config.id} className="table-row">
                        <td className="field-name">{config.name}</td>
                        <td className="field-value">{renderedValue}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 第三部分：产品资料（产品图片） */}
        {productData && productData.productThumb && (
          <div className="product-materials-section">
            <h2 className="section-title">产品资料</h2>
            <div className="product-image-container">
              <img 
                src={productData.productThumb} 
                alt="产品展示" 
                className="product-image"
              />
            </div>
          </div>
        )}

        {/* 第四部分：联系我们 */}
        <div className="contact-section">
          <h2 className="section-title">联系我们</h2>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-label">地址：</span>
              <span className="contact-value">大连经济技术开发区双D港辽河东路88号</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">电话：</span>
              <span className="contact-value">86-411-82168888</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">邮件：</span>
              <span className="contact-value">info@insulators.cn</span>
            </div>
          </div>
        </div>

        {/* 底部图片 */}
        <div className="bottom-image-container">
          <img src={bottomImage} alt="底部图片" className="bottom-image" />
        </div>
        
        {/* 底部公司名称 */}
        <div className="company-footer">
          <p className="company-name">中国·大连电瓷集团股份有限公司</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;