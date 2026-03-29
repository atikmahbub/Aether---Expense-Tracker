import axios, {AxiosRequestConfig} from 'axios';
import {
  IAxiosAjaxUtils,
  IAxiosAjaxResponse,
} from '@trackingPortal/api/utils/IAxiosAjaxUtils';

export class AxiosAjaxUtils implements IAxiosAjaxUtils {
  private accessToken: string | null = null;

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  private buildHeaders(headers?: object): object {
    const defaultHeaders: object = {
      'Content-Type': 'application/json',
      ...(this.accessToken && {Authorization: `Bearer ${this.accessToken}`}),
    };
    return {...defaultHeaders, ...headers};
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
    const config: AxiosRequestConfig = {
      headers: this.buildHeaders(headers),
      params,
    };
    try {
      const response = await axios.get<T>(url.toString(), config);
      console.log(`[GET] ${url}`, {
        params,
        headers: config.headers,
        status: response.status,
        response: response.data,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      console.error(`[GET ERROR] ${url}`, {
        params,
        headers: config.headers,
        error,
      });
      return this.createErrorResponse(error);
    }
  }

  public async post<T>(
    url: URL,
    data: object,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    const config: AxiosRequestConfig = {
      headers: this.buildHeaders(headers),
    };
    try {
      const response = await axios.post<T>(url.toString(), data, config);
      console.log(`[POST] ${url}`, {
        data,
        headers: config.headers,
        status: response.status,
        response: response.data,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      console.error(`[POST ERROR] ${url}`, {
        data,
        headers: config.headers,
        error,
      });
      return this.createErrorResponse(error);
    }
  }

  public async put<T>(
    url: URL,
    data: object,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    const config: AxiosRequestConfig = {
      headers: this.buildHeaders(headers),
    };
    try {
      const response = await axios.put<T>(url.toString(), data, config);
      console.log(`[PUT] ${url}`, {
        data,
        headers: config.headers,
        status: response.status,
        response: response.data,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      console.error(`[PUT ERROR] ${url}`, {
        data,
        headers: config.headers,
        error,
      });
      return this.createErrorResponse(error);
    }
  }

  public async delete<T>(
    url: URL,
    headers?: object,
  ): Promise<IAxiosAjaxResponse<T>> {
    const config: AxiosRequestConfig = {
      headers: this.buildHeaders(headers),
    };
    try {
      const response = await axios.delete<T>(url.toString(), config);
      console.log(`[DELETE] ${url}`, {
        headers: config.headers,
        status: response.status,
        response: response.data,
      });
      return this.createResponse(response.data, response.status);
    } catch (error) {
      console.error(`[DELETE ERROR] ${url}`, {
        headers: config.headers,
        error,
      });
      return this.createErrorResponse(error);
    }
  }
}
