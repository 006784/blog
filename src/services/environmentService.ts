// 天气API服务
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  pressure?: number; // 气压 (hPa)
  visibility?: number; // 能见度 (米)
  uvIndex?: number; // UV指数
  feelsLike?: number; // 体感温度
  location: string;
  timestamp: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number; // 海拔高度 (米)
  accuracy?: number; // 定位精度 (米)
  city: string;
  country: string;
  address: string;
  timezone?: string; // 时区
}

interface ExtendedEnvironmentData {
  location: LocationData;
  weather: WeatherData;
  airQuality?: {
    aqi: number; // 空气质量指数
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  astronomy?: {
    sunrise: string;
    sunset: string;
    moonPhase: string;
  };
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
            const { latitude, longitude, altitude, accuracy } = position.coords;
            
            // 使用逆地理编码获取地址信息
            const locationInfo = await this.reverseGeocode(latitude, longitude);
            
            // 获取时区信息
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            resolve({
              latitude,
              longitude,
              altitude: altitude ? Math.round(altitude) : undefined,
              accuracy: Math.round(accuracy),
              city: locationInfo.city || '未知城市',
              country: locationInfo.country || '未知国家',
              address: locationInfo.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              timezone
            });
          } catch (error) {
            // 如果逆地理编码失败，返回基本坐标信息
            const { latitude, longitude, altitude, accuracy } = position.coords;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            resolve({
              latitude,
              longitude,
              altitude: altitude ? Math.round(altitude) : undefined,
              accuracy: Math.round(accuracy),
              city: '附近',
              country: '',
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              timezone
            });
          }
        },
        (error) => {
          reject(new Error(this.getLocationErrorMessage(error)));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
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
        windDirection: data.wind.deg,
        pressure: data.main.pressure, // 气压 hPa
        visibility: data.visibility, // 能见度 米
        feelsLike: Math.round(data.main.feels_like), // 体感温度
        location: `${location.city}${location.country ? `, ${location.country}` : ''}`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('获取天气信息失败:', error);
      return null;
    }
  }

  // 获取空气质量信息
  static async getAirQuality(location: LocationData): Promise<ExtendedEnvironmentData['airQuality'] | null> {
    try {
      // 使用 OpenWeatherMap 空气质量API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.latitude}&lon=${location.longitude}&appid=${WEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('空气质量服务不可用');
      }
      
      const data = await response.json();
      const components = data.list[0].components;
      
      return {
        aqi: data.list[0].main.aqi,
        pm25: Math.round(components.pm2_5),
        pm10: Math.round(components.pm10),
        o3: Math.round(components.o3),
        no2: Math.round(components.no2),
        so2: Math.round(components.so2),
        co: Math.round(components.co)
      };
    } catch (error) {
      console.warn('获取空气质量信息失败:', error);
      return null;
    }
  }

  // 获取天文信息（日出日落）
  static async getAstronomyInfo(location: LocationData): Promise<ExtendedEnvironmentData['astronomy'] | null> {
    try {
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&formatted=0`
      );
      
      if (!response.ok) {
        throw new Error('天文信息服务不可用');
      }
      
      const data = await response.json();
      
      // 计算月相（简化版）
      const moonPhase = this.calculateMoonPhase();
      
      return {
        sunrise: new Date(data.results.sunrise).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(data.results.sunset).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        moonPhase
      };
    } catch (error) {
      console.warn('获取天文信息失败:', error);
      return null;
    }
  }

  // 简化的月相计算
  private static calculateMoonPhase(): string {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    const day = now.getDate();
    
    let c = 0;
    if (month <= 2) {
      month += 12;
      year--;
    }
    
    c = Math.floor(365.25 * year);
    const e = Math.floor(30.6 * (month + 1));
    const jd = c + e + day - 694039.09;
    const phase = (jd / 29.53) % 1;
    
    if (phase < 0.0625 || phase >= 0.9375) return '新月';
    if (phase < 0.1875) return '峨眉月';
    if (phase < 0.3125) return '上弦月';
    if (phase < 0.4375) return '盈凸月';
    if (phase < 0.5625) return '满月';
    if (phase < 0.6875) return '亏凸月';
    if (phase < 0.8125) return '下弦月';
    return '残月';
  }
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
    airQuality: ExtendedEnvironmentData['airQuality'] | null;
    astronomy: ExtendedEnvironmentData['astronomy'] | null;
    error?: string;
  }> {
    try {
      // 获取位置信息
      const location = await this.getCurrentLocation();
      if (!location) {
        return { location: null, weather: null, airQuality: null, astronomy: null, error: '无法获取位置信息' };
      }

      // 并行获取天气、空气质量和天文信息
      const [weather, airQuality, astronomy] = await Promise.all([
        this.getCurrentWeather(location),
        this.getAirQuality(location),
        this.getAstronomyInfo(location)
      ]);

      return { location, weather, airQuality, astronomy };
    } catch (error) {
      return { 
        location: null, 
        weather: null, 
        airQuality: null,
        astronomy: null,
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