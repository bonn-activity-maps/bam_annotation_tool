angular.module('CVGTool')

    .factory('adminVideosSrvc', function ($state, $http, $httpParamSerializer) {

      return {
        // Admin Log in call
          getInfoOfVideos: function (callbackSuccess) {
              $http({
                  method: 'POST',
                  url: '/api/video/info'

              }).then(function successCallback(response) {
                  callbackSuccess()
                }, function errorCallback(response) {
                  cconsole.log("ERROR when retrieving info from videos.")
              });
          }
      }
});
