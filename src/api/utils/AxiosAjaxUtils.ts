import axios, { AxiosInstance } from 'axios';
import {
  IAxiosAjaxUtils,
  IAxiosAjaxResponse,
} from '@trackingPortal/api/utils/IAxiosAjaxUtils';

export class AxiosAjaxUtils implements IAxiosAjaxUtils {
  private axiosInstance: AxiosInstance;
  private tokenProvider: (() => Promise<string | null>) | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15s timeout for stability
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 1. Proactive Token Interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          if (this.tokenProvider) {
            const token = await this.tokenProvider();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } else if (this.accessToken) {
            config.headers.Authorization = `Bearer ${this.accessToken}`;
          }
        } catch (error) {
          // If token retrieval fails, still try the request, it will likely fail with 401
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Response Interceptor for 401 Handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If it's a 401 and we haven't retried yet
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          this.tokenProvider
        ) {
          originalRequest._retry = true;
          
          try {
            // This will trigger a refresh if needed, using the mutex in AuthProvider
            const token = await this.tokenProvider();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout is usually handled by the provider's getValidToken internal catch
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors or other failures
        return Promise.reject(error);
      }
    );
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public setTokenProvider(provider: () => Promise<string | null>) {
    this.tokenProvider = provider;
  }

  private createResponse<T>(data: T, status: number): IAxiosAjaxResponse<T> {
    return {
      isOk: () => status >= 200 && status < 300,
      value: data,
      error: null,
    };
  }

  private createErrorResponse<T>(error: any): IAxiosAjaxResponse<T> {
    return {
      isOk: () => false,
      value: null,
      error,
    };
  }

  public async get<T>(
    url: URL,
    params?: object,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url.toString(), {
        params,
        headers,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  public async post<T>(
    url: URL,
    data: object,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(url.toString(), data, {
        headers,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  public async put<T>(
    url: URL,
    data: object,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url.toString(), data, {
        headers,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  public async delete<T>(
    url: URL,
    params?: object,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url.toString(), {
        params,
        headers,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}
