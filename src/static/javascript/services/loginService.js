angular.module('CVGTool')
    // 'Login' service manage the authentication function of the page with the server
    .factory('loginSrvc', function ($state, $http, $httpParamSerializer) {
        return {
          // Admin Log in call
            adminLogIn: function (password, callbackSuccess, callbackError) {
                var that = this;
                $http({
                    method: 'GET',
                    url: '/api/adminLogIn',
                    headers: {
                        'password': password
                    }
                }).then(function successCallback(response) {
                    callbackSuccess()
                  }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            }
        }
});
