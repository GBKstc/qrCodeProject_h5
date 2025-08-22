import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processAPI } from '../services/api';
import { useToast } from '../components/Toast';
import './ProcessSelection.css';

const ProcessSelection = () => {
  const [formData, setFormData] = useState({
    process: '',
    // device: '',
    batch: '',    // 批次（size）
    product: ''   // 产品
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  // const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();

  // 数据状态
  const [options, setOptions] = useState({
    processes: [],
    devices: [],
    batches: [],      // 批次列表（size列表）
    products: [],     // 当前选择批次下的产品列表
    allProductData: [] // 完整的产品数据
  });

  // 加载工序数据
  const loadProcessData = async () => {
    try {
      const response = await processAPI.getProcessPageList();
      
      if (response.data && response.data.success && response.data.data && response.data.data.records) {
        const processes = response.data.data.records.map(item => ({
          id: item.id,
          name: item.name,
          descript: item.descript,
          sort: item.sort,
          remark: item.remark
        }));
        
        setOptions(prev => ({
          ...prev,
          processes
        }));
        
        console.log('工序数据加载成功:', processes);
        // showSuccess('工序数据加载成功');
      } else {
        console.error('工序数据格式错误:', response.data);
        // showWarning('工序数据格式异常，使用默认数据');
        // 使用默认数据
        setOptions(prev => ({
          ...prev,
          processes: [
            { id: 'cut', name: '切割工序', descript: '金属切割', sort: 1 },
            { id: 'weld', name: '焊接工序', descript: '金属焊接', sort: 2 },
            { id: 'polish', name: '打磨工序', descript: '表面打磨', sort: 3 },
            { id: 'paint', name: '喷涂工序', descript: '表面喷涂', sort: 4 },
            { id: 'assembly', name: '装配工序', descript: '产品装配', sort: 5 }
          ]
        }));
      }
    } catch (error) {
      console.error('加载工序数据失败:', error);
      // showError('加载工序数据失败，使用默认数据');
      // 使用默认数据作为备选
      setOptions(prev => ({
        ...prev,
        processes: [
          { id: 'cut', name: '切割工序', descript: '金属切割', sort: 1 },
          { id: 'weld', name: '焊接工序', descript: '金属焊接', sort: 2 },
          { id: 'polish', name: '打磨工序', descript: '表面打磨', sort: 3 },
          { id: 'paint', name: '喷涂工序', descript: '表面喷涂', sort: 4 },
          { id: 'assembly', name: '装配工序', descript: '产品装配', sort: 5 }
        ]
      }));
    }
  };

  // 加载设备数据
  const loadDeviceData = async () => {
    try {
      const response = await processAPI.getDevicePageList();
      
      if (response.data && response.data.success && response.data.data && response.data.data.records) {
        const devices = response.data.data.records.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code,
          type: item.type,
          status: item.status,
          productionProcessesId: item.productionProcessesId,
          productionProcessesName: item.productionProcessesName,
          qrcodeNum: item.qrcodeNum,
          sort: item.sort,
          remark: item.remark
        }));
        
        setOptions(prev => ({
          ...prev,
          devices
        }));
        
        console.log('设备数据加载成功:', devices);
        // showSuccess('设备数据加载成功');
      } else {
        console.error('设备数据格式错误:', response.data);
        // showWarning('设备数据格式异常，使用默认数据');
        // 使用默认数据
        setOptions(prev => ({
          ...prev,
          devices: [
            { id: 'dev001', name: '设备A-001', code: 'DEV001', status: 1, type: 1 },
            { id: 'dev002', name: '设备B-002', code: 'DEV002', status: 1, type: 1 },
            { id: 'dev003', name: '设备C-003', code: 'DEV003', status: 0, type: 1 },
            { id: 'dev004', name: '设备D-004', code: 'DEV004', status: 1, type: 1 },
            { id: 'dev005', name: '设备E-005', code: 'DEV005', status: 1, type: 1 }
          ]
        }));
      }
    } catch (error) {
      console.error('加载设备数据失败:', error);
      // showError('加载设备数据失败，使用默认数据');
      // 使用默认数据作为备选
      setOptions(prev => ({
        ...prev,
        devices: [
          { id: 'dev001', name: '设备A-001', code: 'DEV001', status: 1, type: 1 },
          { id: 'dev002', name: '设备B-002', code: 'DEV002', status: 1, type: 1 },
          { id: 'dev003', name: '设备C-003', code: 'DEV003', status: 0, type: 1 },
          { id: 'dev004', name: '设备D-004', code: 'DEV004', status: 1, type: 1 },
          { id: 'dev005', name: '设备E-005', code: 'DEV005', status: 1, type: 1 }
        ]
      }));
    }
  };

  // 加载产品与批次数据
  const loadProductData = async () => {
    try {
      const response = await processAPI.getProductSizeList();
      
      if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
        const productSizeData = response.data.data;
        
        // 提取批次列表（size列表）
        const batches = productSizeData.map(item => ({
          id: item.size,
          size: item.size,
          name: item.size,
          products: item.products || []
        }));
        
        setOptions(prev => ({
          ...prev,
          batches,
          allProductData: productSizeData,
          products: [] // 初始时产品列表为空
        }));
        
        console.log('批次数据加载成功:', batches);
        console.log('完整产品数据:', productSizeData);
        // showSuccess('产品数据加载成功');
      } else {
        console.error('产品数据格式错误:', response.data);
        // showWarning('产品数据格式异常，使用默认数据');
        // 使用默认数据
        setOptions(prev => ({
          ...prev,
          batches: [
            { id: '001', size: '001', name: '批次001' },
            { id: 'sad', size: 'sad', name: '批次sad' },
            { id: '123132', size: '123132', name: '批次123132' }
          ],
          products: [],
          allProductData: []
        }));
      }
    } catch (error) {
      console.error('加载产品数据失败:', error);
      // showError('加载产品数据失败，使用默认数据');
      // 使用默认数据作为备选
      setOptions(prev => ({
        ...prev,
        batches: [
          { id: '001', size: '001', name: '批次001' },
          { id: 'sad', size: 'sad', name: '批次sad' },
          { id: '123132', size: '123132', name: '批次123132' }
        ],
        products: [],
        allProductData: []
      }));
    }
  };

  // 加载所有数据
  const loadAllData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadProcessData(),
        loadDeviceData(),
        loadProductData()
      ]);
    } finally {
      setDataLoading(false);
      // showSuccess('数据初始化完成');
    }
  };

  useEffect(() => {
    // 环境检测和调试信息
    console.log('🔍 [调试] ProcessSelection组件已挂载');
    console.log('🔍 [调试] 用户代理:', navigator.userAgent);
    console.log('🔍 [调试] 屏幕尺寸:', window.screen.width + 'x' + window.screen.height);
    console.log('🔍 [调试] 视口尺寸:', window.innerWidth + 'x' + window.innerHeight);
    console.log('🔍 [调试] 是否为移动设备:', /Mobi|Android/i.test(navigator.userAgent));
    console.log('🔍 [调试] 是否支持触摸:', 'ontouchstart' in window);
    console.log('🔍 [调试] localStorage可用:', typeof(Storage) !== "undefined");
    
    // 全局错误捕获
    const handleGlobalError = (event) => {
      console.error('🔍 [调试] 全局JavaScript错误:', event.error);
      // showError('🔍 调试：检测到JavaScript错误 - ' + event.error?.message);
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('🔍 [调试] 未处理的Promise拒绝:', event.reason);
      // showError('🔍 调试：检测到Promise错误 - ' + event.reason);
    };
    
    // 添加错误监听器
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // 测试Toast功能
    // showInfo('🔍 调试：页面环境检测完成');
    
    // 恢复之前的选择（如果有的话）
    const savedData = localStorage.getItem('processSelectionData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
    
    // 加载所有数据
    // showInfo('正在初始化数据...');
    loadAllData();
    
    // 清理函数
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 当批次选择改变时，更新产品列表
  useEffect(() => {
    if (formData.batch && options.allProductData.length > 0) {
      const selectedBatch = options.allProductData.find(item => item.size === formData.batch);
      if (selectedBatch && selectedBatch.products) {
        const products = selectedBatch.products.map(product => ({
          id: product.id,
          size: product.size,
          colour: product.colour,
          thumbCode: product.thumbCode,
          batchCode: product.batchCode,
          trademark: product.trademark,
          productThumb: product.productThumb,
          remark: product.remark,
          operateId: product.operateId,
          operateName: product.operateName
        }));
        
        setOptions(prev => ({
          ...prev,
          products
        }));
        
        console.log('更新产品列表:', products);
      } else {
        setOptions(prev => ({
          ...prev,
          products: []
        }));
      }
    } else {
      setOptions(prev => ({
        ...prev,
        products: []
      }));
      // 清空产品选择
      if (formData.product) {
        setFormData(prev => ({
          ...prev,
          product: ''
        }));
      }
    }
  }, [formData.batch, options.allProductData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 如果是工序选择变化，需要检查是否需要清空产品选择
    if (name === 'process') {
      const selectedProcess = options.processes.find(p => p.id == value);
      const processName = selectedProcess ? selectedProcess.name : '';
      // 如果选择的是非上釉和胶装工序，清空产品和批次选择
      if (processName.includes('上釉') || processName.includes('胶装')) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          batch: '',
          product: ''
        }));
        // showInfo('工序已选择，相关选项已重置');
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        // showInfo('工序已选择');
      }
    } else if (name === 'batch') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        product: ''
      }));
      // showInfo('产品已选择，批次选项已重置');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.process) newErrors.process = '请选择工序';
    // if (!formData.device) newErrors.device = '请选择设备';
    
    // 只有在需要显示产品选择时才验证产品和批次
    if (shouldShowProductSelection()) {
      if (!formData.batch) newErrors.batch = '请选择产品';
      if (!formData.product) newErrors.product = '请选择批次';
    }
    
    setErrors(newErrors);
    
    // 显示验证错误提醒
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors);
      // showError(`表单验证失败：${errorMessages.join('，')}`);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('🔍 [调试] handleSubmit 方法被调用');
    // showInfo('🔍 调试：开始提交流程...');
    
    console.log('🔍 [调试] 当前表单数据:', formData);
    console.log('🔍 [调试] 当前选项数据:', options);
    
    // 验证表单
    console.log('🔍 [调试] 开始验证表单...');
    if (!validateForm()) {
      console.log('🔍 [调试] 表单验证失败，停止提交');
      // showError('🔍 调试：表单验证失败');
      return;
    }
    console.log('🔍 [调试] 表单验证通过');
    // showInfo('🔍 调试：表单验证通过');

    setLoading(true);
    // showInfo('🔍 调试：正在提交数据...');
    
    try {
      console.log('🔍 [调试] 进入try块，开始构建选择数据');

      // 构建完整的选择数据
      console.log('🔍 [调试] 查找选中的工序...');
      const selectedProcess = options.processes.find(p => p.id == formData.process);
      console.log('🔍 [调试] 选中的工序:', selectedProcess);
      
      if (!selectedProcess) {
        throw new Error('未找到选中的工序数据');
      }
      
      // const selectedDevice = options.devices.find(d => d.id == formData.device);
      
      // 只有在需要显示产品选择时才获取产品和批次数据
      let selectedBatch = null;
      let selectedProduct = null;
      
      console.log('🔍 [调试] 检查是否需要产品选择...');
      const needProductSelection = shouldShowProductSelection();
      console.log('🔍 [调试] 需要产品选择:', needProductSelection);
      
      if (needProductSelection) {
        console.log('🔍 [调试] 查找选中的批次和产品...');
        selectedBatch = options.batches.find(b => b.id == formData.batch);
        selectedProduct = options.products.find(p => p.id == parseInt(formData.product));
        console.log('🔍 [调试] 选中的批次:', selectedBatch);
        console.log('🔍 [调试] 选中的产品:', selectedProduct);
        
        if (!selectedBatch) {
          throw new Error('未找到选中的批次数据');
        }
        if (!selectedProduct) {
          throw new Error('未找到选中的产品数据');
        }
      }
      
      console.log('🔍 [调试] 构建最终选择数据...');
      const selectionData = {
        process: selectedProcess,
        // device: selectedDevice,
        batch: selectedBatch,
        product: selectedProduct,
        timestamp: new Date().toISOString()
      };
      console.log('🔍 [调试] 最终选择数据:', selectionData);
      
      // 保存选择的数据
      console.log('🔍 [调试] 保存数据到localStorage...');
      try {
        localStorage.setItem('processSelectionData', JSON.stringify(formData));
        localStorage.setItem('currentSelectionData', JSON.stringify(selectionData));
        console.log('🔍 [调试] localStorage保存成功');
      } catch (storageError) {
        console.error('🔍 [调试] localStorage保存失败:', storageError);
        throw new Error('数据保存失败: ' + storageError.message);
      }
      
      console.log('🔍 [调试] 提交的选择数据:', selectionData);
      
      // showSuccess('🔍 调试：提交成功，正在跳转到扫码页面...');
      console.log('🔍 [调试] 准备跳转到扫码页面...');
      
      // 跳转扫码页面

      navigate('/scanner');
    } catch (error) {
      console.error('🔍 [调试] Submit failed:', error);
      console.error('🔍 [调试] 错误堆栈:', error.stack);
      // showError('🔍 调试：提交失败 - ' + error.message);
    } finally {
      console.log('🔍 [调试] 设置loading为false');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      // showInfo('正在退出登录...');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('processSelectionData');
      localStorage.removeItem('currentSelectionData');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
    }
  };

  const getUsername = () => {
    return localStorage.getItem('username') || '用户';
  };

  // 获取设备状态文本
  const getDeviceStatusText = (status) => {
    switch (status) {
      case 1:
        return '正常';
      case 0:
        return '维护中';
      default:
        return '未知';
    }
  };

  // 获取设备类型文本
  const getDeviceTypeText = (type) => {
    switch (type) {
      case 1:
        return '喷码机';
      case 2:
        return 'PDA';
      default:
        return '其他设备';
    }
  };

  // 判断是否需要显示产品选择（非上釉和胶装工序不显示产品选择）
  const shouldShowProductSelection = () => {
    if (!formData.process) return false;
    
    const selectedProcess = options.processes.find(p => p.id == formData.process);
    if (!selectedProcess) return false;
    
    const processName = selectedProcess.name;
    // 如果工序名称包含"上釉"或"胶装"，则不显示产品选择
    return (processName.includes('上釉') || processName.includes('胶装'));
  };

  return (
    <div className="page-container">
      {/* <ToastContainer /> */}
      <div className="page-header">
        <span>工序选择</span>
        <div className="header-actions">
          <span className="username">欢迎，{getUsername()}</span>
          <button className="logout-btn" onClick={handleLogout}>
            退出
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>请选择工序信息</h2>
            <p>请完成以下所有选择项后提交</p>
          </div>
          
          <div className="card-body">
            {dataLoading ? (
              <div className="loading-container">
                <div className="loading-text">正在加载数据...</div>
              </div>
            ) : (
              <div className="selection-form">
                <div className="form-group">
                  <label className="form-label">选择工序 *</label>
                  <select 
                    name="process"
                    className={`form-select ${errors.process ? 'error' : ''}`}
                    value={formData.process}
                    onChange={handleInputChange}
                  >
                    <option value="">请选择工序</option>
                    {options.processes.map(process => (
                      <option key={process.id} value={process.id}>
                        {process.name}
                      </option>
                    ))}
                  </select>
                  {errors.process && (
                    <div className="field-error">{errors.process}</div>
                  )}
                </div>

                {/* <div className="form-group">
                  <label className="form-label">选择设备 *</label>
                  <select 
                    name="device"
                    className={`form-select ${errors.device ? 'error' : ''}`}
                    value={formData.device}
                    onChange={handleInputChange}
                  >
                    <option value="">请选择设备</option>
                    {options.devices.map(device => (
                      <option 
                        key={device.id} 
                        value={device.id}
                        // disabled={device.status === 1}
                      >
                        {device.name} ({device.code}) - {getDeviceTypeText(device.type)} 
                      </option>
                    ))}
                  </select>
                  {errors.device && (
                    <div className="field-error">{errors.device}</div>
                  )}
                </div> */}

                {shouldShowProductSelection() && (
                  <>
                    <div className="form-group">
                      <label className="form-label">选择产品 *</label>
                      <select 
                        name="batch"
                        className={`form-select ${errors.batch ? 'error' : ''}`}
                        value={formData.batch}
                        onChange={handleInputChange}
                      >
                        <option value="">请选择产品</option>
                        {options.batches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            产品: {batch.size}
                          </option>
                        ))}
                      </select>
                      {errors.batch && (
                        <div className="field-error">{errors.batch}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">选择批次 *</label>
                      <select 
                        name="product"
                        className={`form-select ${errors.product ? 'error' : ''}`}
                        value={formData.product}
                        onChange={handleInputChange}
                        disabled={!formData.batch}
                      >
                        <option value="">{!formData.batch ? '请先选择产品' : '请选择批次'}</option>
                        {options.products.map(product => (
                          <option key={product.id} value={product.id}>
                            {/* {product.thumbCode} - {product.colour} - {product.batchCode} */}
                            {product.batchCode}
                          </option>
                        ))}
                      </select>
                      {errors.product && (
                        <div className="field-error">{errors.product}</div>
                      )}
                    </div>
                  </>
                )}

                <button 
                  className="btn btn-primary btn-block submit-btn"
                  onClick={(e) => {
                    console.log('🔍 [调试] 提交按钮被点击了！');
                    console.log('🔍 [调试] 点击事件对象:', e);
                    console.log('🔍 [调试] 按钮是否禁用:', loading);
                    console.log('🔍 [调试] 当前时间:', new Date().toISOString());
                    // showInfo('🔍 调试：检测到按钮点击事件');
                    
                    // 防止事件冒泡
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (loading) {
                      console.log('🔍 [调试] 按钮处于loading状态，忽略点击');
                      // showWarning('🔍 调试：按钮处于加载状态，请等待');
                      return;
                    }
                    
                    console.log('🔍 [调试] 准备调用handleSubmit方法...');
                    handleSubmit();
                  }}
                  disabled={loading}
                  style={{
                    touchAction: 'manipulation', // 防止移动端双击缩放
                    userSelect: 'none' // 防止文本选择
                  }}
                >
                  {loading ? '提交中...' : '提交并进入扫码'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSelection;