/**
 * @description makes an object from a query string
 * @example 'param1=asdf&param2=asdf' => { param1: 'asdf', param2: 'asdf'}
 */
export const parseQueries = (queries: string) => {
  const parsed = Object.fromEntries(new URLSearchParams(queries) as any);
  return parsed;
};

/**
 * @description makes a query string from an object
 * @example { param1: 'asdf', param2: 'asdf'} => 'param1=asdf&param2=asdf'
 */
export const formatQueries = (data: any) => {
  const queries = new URLSearchParams(Object.entries(data)).toString();
  return queries;
};
