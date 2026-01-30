// 天气API服务
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  timestamp: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address: string;
}

// 使用免费的天气API服务
const WEATHER_API_KEY = 'YOUR_WEATHER_API_KEY'; // 需要在环境变量中配置
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// 地理位置服务
export class EnvironmentService {
  // 获取当前位置
  static async getCurrentLocation(): Promise<LocationData | null> {
    // 检查浏览器支持
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('浏览器不支持地理位置');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // 使用逆地理编码获取地址信息
            const locationInfo = await this.reverseGeocode(latitude, longitude);
            
            resolve({
              latitude,
              longitude,
              city: locationInfo.city || '未知城市',
              country: locationInfo.country || '未知国家',
              address: locationInfo.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          } catch (error) {
            // 如果逆地理编码失败，返回基本坐标信息
            const { latitude, longitude } = position.coords;
            resolve({
              latitude,
              longitude,
              city: '附近',
              country: '',
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        },
        (error) => {
          reject(new Error(this.getLocationErrorMessage(error)));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分钟缓存
        }
      );
    });
  }

  // 逆地理编码获取地址信息
  private static async reverseGeocode(lat: number, lon: number): Promise<any> {
    try {
      // 使用免费的逆地理编码服务
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh-CN`
      );
      
      if (!response.ok) {
        throw new Error('逆地理编码服务不可用');
      }
      
      const data = await response.json();
      
      return {
        city: data.address.city || data.address.town || data.address.village || '',
        country: data.address.country || '',
        address: data.display_name || ''
      };
    } catch (error) {
      console.warn('逆地理编码失败:', error);
      return { city: '', country: '', address: '' };
    }
  }

  // 获取当前位置的天气信息
  static async getCurrentWeather(location: LocationData): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE}?lat=${location.latitude}&lon=${location.longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=zh_cn`
      );
      
      if (!response.ok) {
        throw new Error('天气服务不可用');
      }
      
      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        condition: this.translateWeatherCondition(data.weather[0].description),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // 转换为 km/h
        location: `${location.city}${location.country ? `, ${location.country}` : ''}`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('获取天气信息失败:', error);
      return null;
    }
  }

  // 使用备用天气服务（如果主服务不可用）
  static async getFallbackWeather(location: LocationData): Promise<WeatherData | null> {
    try {
      // 使用 wttr.in 服务作为备选
      const response = await fetch(
        `https://wttr.in/${location.latitude},${location.longitude}?format=j1`
      );
      
      if (!response.ok) {
        throw new Error('备用天气服务不可用');
      }
      
      const data = await response.json();
      const current = data.current_condition[0];
      
      return {
        temperature: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
        location: `${location.city}${location.country ? `, ${location.country}` : ''}`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('备用天气服务也失败:', error);
      return null;
    }
  }

  // 翻译天气条件
  private static translateWeatherCondition(condition: string): string {
    const translations: Record<string, string> = {
      'clear sky': '晴天',
      'few clouds': '少云',
      'scattered clouds': '疏云',
      'broken clouds': '碎云',
      'overcast clouds': '阴天',
      'light rain': '小雨',
      'moderate rain': '中雨',
      'heavy intensity rain': '大雨',
      'very heavy rain': '暴雨',
      'extreme rain': '特大暴雨',
      'freezing rain': '冻雨',
      'light snow': '小雪',
      'snow': '雪',
      'heavy snow': '大雪',
      'sleet': '雨夹雪',
      'shower sleet': '阵雨夹雪',
      'light rain and snow': '小雨雪',
      'rain and snow': '雨雪',
      'light shower snow': '小阵雪',
      'shower snow': '阵雪',
      'heavy shower snow': '大阵雪',
      'mist': '薄雾',
      'smoke': '烟雾',
      'haze': '霾',
      'sand/dust whirls': '沙尘旋风',
      'fog': '雾',
      'sand': '沙',
      'dust': '尘',
      'volcanic ash': '火山灰',
      'squalls': '飑',
      'tornado': '龙卷风'
    };
    
    return translations[condition.toLowerCase()] || condition;
  }

  // 获取综合环境信息
  static async getEnvironmentInfo(): Promise<{
    location: LocationData | null;
    weather: WeatherData | null;
    error?: string;
  }> {
    try {
      // 获取位置信息
      const location = await this.getCurrentLocation();
      if (!location) {
        return { location: null, weather: null, error: '无法获取位置信息' };
      }

      // 获取天气信息
      let weather = await this.getCurrentWeather(location);
      
      // 如果主天气服务失败，尝试备用服务
      if (!weather) {
        weather = await this.getFallbackWeather(location);
      }

      return { location, weather };
    } catch (error) {
      return { 
        location: null, 
        weather: null, 
        error: error instanceof Error ? error.message : '获取环境信息失败' 
      };
    }
  }

  // 错误消息处理
  private static getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return '用户拒绝了地理位置请求';
      case error.POSITION_UNAVAILABLE:
        return '位置信息不可用';
      case error.TIMEOUT:
        return '获取位置信息超时';
      default:
        return '获取位置信息时发生未知错误';
    }
  }

  // 检查浏览器支持情况
  static checkSupport(): { 
    geolocation: boolean; 
    permissions: boolean; 
  } {
    return {
      geolocation: !!navigator.geolocation,
      permissions: !!navigator.permissions
    };
  }

  // 请求位置权限
  static async requestLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) {
      // 如果不支持Permissions API，直接尝试获取位置
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('权限查询失败:', error);
      return false;
    }
  }
}