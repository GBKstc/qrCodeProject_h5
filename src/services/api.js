import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('发送请求:', config.method?.toUpperCase(), config.url);
    
    // 如果是表单数据，转换为URLSearchParams格式
    if (config.headers['Content-Type'] === 'application/x-www-form-urlencoded' && config.data) {
      const params = new URLSearchParams();
      Object.keys(config.data).forEach(key => {
        params.append(key, config.data[key]);
      });
      config.data = params;
    }
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('响应错误:', error);
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      switch (status) {
        case 401:
          console.error('未授权，请重新登录');
          // 清除本地存储的登录信息
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('selectionData');
          
          // 跳转到登录页面
          window.location.href = '/login';
          break;
        case 403:
          console.error('禁止访问');
          break;
        case 404:
          console.error('接口不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error(`请求失败: ${status}`);
      }
      return Promise.reject(data || error.message);
    } else if (error.request) {
      // 网络错误
      console.error('网络错误，请检查网络连接');
      return Promise.reject('网络错误，请检查网络连接');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      return Promise.reject(error.message);
    }
  }
);

// API接口定义
export const authAPI = {
  // 登录接口
  login: (userName, passWord) => {
    return api.post('/login', {
      userName,
      passWord
    });
  }
};

// 工序相关API
export const processAPI = {
  // 获取工序分页列表
  getProcessPageList: (params = {}) => {
    // 默认参数：发送999获取所有工序
    const defaultParams = {
      currPage: 1,
      pageSize: 999,
      ...params
    };
    
    return api.get('/daciProductionProcesses/pageList', {
      params: defaultParams
    });
  },
  
  // 获取设备分页列表
  getDevicePageList: (params = {}) => {
    // 默认参数：发送999获取所有设备
    const defaultParams = {
      currPage: 1,
      pageSize: 999,
      type:2,//pda设备
      ...params
    };
    
    return api.get('/daciDevice/pageList', {
      params: defaultParams
    });
  },
  
  // 获取产品与批次列表
  getProductSizeList: () => {
    return api.get('/daciProduct/getProductSizeList');
  }
};

// 扫码相关API
export const scanAPI = {
  // 扫码接口
  take: (data) => {
    return api.post('/daciProduce/take', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  
  // 根据二维码ID获取展示详情
  getByQrCode: (qrcodeId) => {
    return api.get('/daciProduce/getByQrCode', {
      params: { qrcodeId }
    });
  },
  
  // 获取展示设定配置
  getShowConfig: () => {
    return api.get('/daciProduceShow/pageList');
  },
  
  // 提交扫码结果（保留原有接口）
  submitScanResult: (data) => {
    return api.post('/scan/submit', data);
  },
  
  // 获取扫码历史
  getScanHistory: (userId) => {
    return api.get(`/scan/history/${userId}`);
  }
};

// 二维码相关API
export const qrcodeAPI = {
  // 获取二维码详情
  getDetail: (infoId) => {
    return api.get('/daciQrcode/getInfo', {
      params: { infoId }
    });
  }
};

export default api;