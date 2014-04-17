<?php

class Wappalyzer
{
	public
		$debug              = false,
		$curlUserAgent      = 'Mozilla/5.0 (X11; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
		$curlFollowLocation = true,
		$curlTimeout        = 5,
		$curlMaxRedirects   = 3
		;

	protected
		$v8,
		$apps,
		$categories
		;

	/**
	 * Constructor
	 */
	public function __construct($url)
	{
		chdir(dirname(__FILE__));

		$this->v8 = new V8Js();

		$this->url = $url;

		$json = json_decode(file_get_contents('apps.json'));

		$this->apps       = $json->apps;
		$this->categories = $json->categories;
	}

	/**
	 * Analyze a website
	 * @param string $url
	 */
	public function analyze()
	{
		try {
			$this->load(array('wappalyzer.js', 'driver.js'));

			$result = $this->curl($this->url);

			//$env = $this->executeScripts($result);

			$json = json_encode(array(
				'host'    => $result->host,
				'url'     => $result->url,
				'html'    => $result->html,
				'headers' => $result->headers,
				//'env'     => $env
				));

			$result = $this->v8->executeString('
				w.apps         = ' . json_encode($this->apps) . ';
				w.categories   = ' . json_encode($this->categories) . ';
				w.driver.debug = ' . ( $this->debug ? 'true' : 'false' ) . ';
				w.driver.data  = ' . $json . ';

				w.driver.init();
				');

			return json_decode($result);
		} catch ( V8JsException $e ) {
			throw new WappalyzerException('JavaScript error: ' . $e->getMessage());
		}
	}

	/**
	 * Load and execute one or more JavaScript files
	 * @param mixed $files
	 */
	protected function load($files)
	{
		if ( !is_array($files) ) {
			$files = array($files);
		}

		foreach ( $files as $file ) {
			$this->v8->executeString(file_get_contents('js/' . $file), $file);
		}
	}

	/**
	 * Perform a cURL request
	 * @param string $url
	 */
	protected function curl($url)
	{
		if ( $this->debug ) {
			echo 'cURL request: ' . $url . "\n";
		}

		$ch = curl_init($url);

		curl_setopt_array($ch, array(
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_HEADER         => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => $this->curlFollowLocation,
			CURLOPT_MAXREDIRS      => $this->curlMaxRedirects,
			CURLOPT_TIMEOUT        => $this->curlTimeout,
			CURLOPT_USERAGENT      => $this->curlUserAgent
			));

		$response = curl_exec($ch);

		if ( curl_errno($ch) !== 0 ) {
			throw new WappalyzerException('cURL error: ' . curl_error($ch));
		}

		$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

		if ( $httpCode != 200 ) {
			throw new WappalyzerException('cURL request returned HTTP code ' . $httpCode);
		}

		$result = new stdClass();

		$result->url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

		$result->host = parse_url($result->url, PHP_URL_HOST);

		$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

		$result->html = substr($response, $headerSize);

		$result->html = mb_check_encoding($result->html, 'UTF-8') ? $result->html : utf8_encode($result->html);
		
		$headers = trim(substr($response, 0, $headerSize));
		$headers = preg_split('/^\s*$/m', $headers);
		$headers = end($headers);
		$lines = array_slice(explode("\r\n", $headers), 1);

		foreach ( $lines as $line ) {
			if ( strpos(trim($line), ': ') !== false ) {
				list($key, $value) = explode(': ', $line);

				$result->headers[strtolower($key)] = $value;
			}
		}

		return $result;
	}

	/**
	 *
	 */
	protected function executeScripts($page)
	{
		preg_match_all('/<script[^>]+src=("|\')(.+?)\1/i', $page->html, $matches);

		if ( $urls = $matches[2] ) {
			foreach ( $urls as $url ) {
				if ( !preg_match('/^https?:\/\//', $url) ) {
					$url = $page->url . '/' . $url;
				}

				try {
					$result = $this->curl($url);
				} catch ( WappalyzerException $e ) {
					if ( $this->debug ) echo $e->getMessage() . "\n";

					continue;
				}

				$v8 = new V8Js();

				try {
					$v8->executeString('
						var
							document = {},
							window   = { document: document }
							;
						');

					$v8->executeString($result->html, $url);

					$result = $v8->executeString('Object.keys(window);');

					var_dump($result);
				} catch ( V8JsException $e ) {
					if ( $this->debug ) echo "\n", print_r($e->getJsTrace()), "\n\n";

					continue;
				}
			}
		}
	}
}
