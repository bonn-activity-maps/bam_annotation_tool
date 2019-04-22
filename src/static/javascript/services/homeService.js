angular.module('CVGTool')

    .factory('homeSrvc', function ($state, $http, $httpParamSerializer) {
        return {
          getInfoOfVideos: function (callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/video/info'

              }).then(function successCallback(response) {
                  callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                  console.log("ERROR when retrieving info from videos.")
              });
          },
        }
});
