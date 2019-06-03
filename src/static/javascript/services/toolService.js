angular.module('CVGTool')

    .factory('toolSrvc', function ($state, $http, $httpParamSerializer) {

        return {
          getInfoOfVideos: function (callbackSuccess, dataset) {
              $http({
                  method: 'GET',
                  url: '/api/dataset/getVideos',
                  headers: {
                      'dataset': dataset
                  }
              }).then(function successCallback(response) {
                  if (response.data.msg.length === 0) {
                    callbackSuccess([])
                  } else {
                    callbackSuccess(response.data.msg)
                  }
                }, function errorCallback(response) {
                  console.log(response.data.msg);
              });
          },

          getFrame: function (fileName, frame, dataset, callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/dataset/getFrameVideo',
                  headers: {
                      'fileName': fileName,
                      'frame': frame,
                      'dataset': dataset
                  }
              }).then(function successCallback(response) {
                  callbackSuccess(response.data.msg.image,response.data.msg.filename,response.data.msg.frame);
              }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          },

          retrieveAvaiableObjects: function(callbackSuccess) {
              $http({
                  method: 'GET',
                  url: ''
              }).then(function successCallback(response)) {
                  callbackSuccess(response.data);
              }, function errorCallback(response) {
                  console.log(response.data.msg);
              });
          },
        }
});
