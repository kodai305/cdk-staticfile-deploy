function handler(event) {
  try {
    /**
     *  eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
     *  に対する処理をするFunction.
    */  
    var request = event.request;
    var host = request.headers.host.value;
    var queryString = request.querystring;
    var uri = request.uri;

    // Check the URI is '/dir1'.
    if (uri === '/dir1/hellowworld') {
      var queryStringParameter = Object.keys(queryString).map(function(key) {
          return key + '=' + encodeURIComponent(queryString[key].value);
      }).join('&');
      queryStringParameter = '?' + queryStringParameter;
      var newurl = `https://${host}/dir1/hellowworld.html` + queryStringParameter;
      var response = {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers:
          { "location": { "value": newurl } }
      }
      return response;
    } else {
      return request;
    }
  } catch (error) {
    console.error("An error occurred: ", error);
    var request = event.request;
    return request;
  }
}