angular.module('CVGTool')

    .factory('homeSrvc', function ($state, $http, $httpParamSerializer) {
        return {
          getInfoOfVideos: function (callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/video/info'

              }).then(function successCallback(response) {
                  if (response.data.msg.length == 0) {
                    callbackSuccess([])
                  } else {
                    var parsedArray = []
                    for (i = 0; i < response.data.msg.length; i++) {
                      parsedArray.push(JSON.parse(response.data.msg[i]))
                    }
                    callbackSuccess(parsedArray)
                  }
                }, function errorCallback(response) {
                  console.log("ERROR when retrieving info from videos.")
              });
          },
        }
});
