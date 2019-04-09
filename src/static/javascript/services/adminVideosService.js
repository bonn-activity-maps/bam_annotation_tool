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
          },

          deleteVideo: function (videoName, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/video/delete',
                data: {
                  'name': videoName
                }
              }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                  callbackError(response.data.msg)
              });
          }
      }
});
