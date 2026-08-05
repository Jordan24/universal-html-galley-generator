import { CORSProxyOption } from '../../../shared/types/galleyTypes';

export const PROXY_OPTIONS: CORSProxyOption[] = [
  {
    id: 'allorigins',
    name: 'AllOrigins CORS Proxy (Default)',
    urlTemplate: 'https://api.allorigins.win/raw?url=',
    description: 'Free open-source CORS proxy for web scraping',
  },
  {
    id: 'corsproxy',
    name: 'CORS Proxy IO',
    urlTemplate: 'https://corsproxy.io/?',
    description: 'Fast public CORS fetch proxy service',
  },
  {
    id: 'codetabs',
    name: 'CodeTabs CORS Proxy',
    urlTemplate: 'https://api.codetabs.com/v1/proxy?quest=',
    description: 'Alternative CORS proxy for academic sites',
  },
  {
    id: 'custom',
    name: 'Custom CORS Proxy Endpoint',
    urlTemplate: '',
    description: 'User-entered proxy endpoint',
  },
];

export async function fetchHtmlViaProxy(
  targetUrl: string,
  proxyOptionId: string,
  customProxyUrl?: string
): Promise<string> {
  const selectedProxy = PROXY_OPTIONS.find((p) => p.id === proxyOptionId) || PROXY_OPTIONS[0];

  let proxyFetchUrl = '';
  if (selectedProxy.id === 'custom' && customProxyUrl) {
    proxyFetchUrl = customProxyUrl.includes('{url}') 
      ? customProxyUrl.replace('{url}', encodeURIComponent(targetUrl))
      : customProxyUrl + encodeURIComponent(targetUrl);
  } else {
    proxyFetchUrl = selectedProxy.urlTemplate + encodeURIComponent(targetUrl);
  }

  try {
    const response = await fetch(proxyFetchUrl);
    if (!response.ok) {
      throw new Error(`Proxy responded with status ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Received empty response body from target URL via proxy');
    }
    return text;
  } catch (primaryErr) {
    // If user specified custom proxy or didn't select allorigins, re-throw primary error
    if (selectedProxy.id === 'custom' || selectedProxy.id !== 'allorigins') {
      throw primaryErr;
    }

    // Auto fallback from AllOrigins to CorsProxy.io if primary fails
    try {
      const fallbackUrl = PROXY_OPTIONS[1].urlTemplate + encodeURIComponent(targetUrl);
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const text = await fallbackResponse.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      }
    } catch {
      // Fallback also failed, throw original error
    }
    throw primaryErr;
  }
}

