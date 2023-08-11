function handler(event) {
    /**
     * eventType: VIEWER_REQUESTかVIEWER_RESPONSE
     * を処理するFunction.
     */
    var response = event.response;
    var headers = response.headers;

    // Set the content-type header
    headers['content-type'] = {value: 'application/json'};

    // Return response to viewers
    return response;
}
