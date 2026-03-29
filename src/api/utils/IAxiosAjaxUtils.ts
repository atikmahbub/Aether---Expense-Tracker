// Define a custom response interface for handling isOk and data/error
export interface IAxiosAjaxResponse<T> {
  isOk: () => boolean;
  value?: T | null;
  error?: any;
}

export interface IAxiosAjaxUtils {
  setAccessToken: (token: string) => void;
  get: <T>(url: URL, headers?: object) => Promise<IAxiosAjaxResponse<T>>;
  post: <T>(
    url: URL,
    data: object,
    headers?: object
  ) => Promise<IAxiosAjaxResponse<T>>;
  put: <T>(
    url: URL,
    data: object,
    headers?: object
  ) => Promise<IAxiosAjaxResponse<T>>;
  delete: <T>(url: URL, headers?: object) => Promise<IAxiosAjaxResponse<T>>;
}
