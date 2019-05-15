angular.module('CVGTool')

    .factory('toolSrvc', function ($state, $http, $httpParamSerializer) {
        return {
          getInfoOfVideos: function (callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/dataset/getVideos'

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
                  console.log(response.data.msg);
              });
          },

          getFrame: function (fileName, frame, callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/dataset/getFrameVideo',
                  headers: {
                      'fileName': fileName,
                      'frame': frame
                  }
              }).then(function successCallback(response) {
                  callbackSuccess(response.data.msg.image,response.data.msg.filename,response.data.msg.frame);
              }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          },
        }
});
