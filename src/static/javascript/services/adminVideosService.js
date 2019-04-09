angular.module('CVGTool')

    .factory('adminVideosSrvc', function ($state, $http, $httpParamSerializer) {

      return {
        // Admin Log in call
          getInfoOfVideos: function (callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/video/info'

              }).then(function successCallback(response) {
                  callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                  console.log("ERROR when retrieving info from videos.")
              });
          }
      }
});
