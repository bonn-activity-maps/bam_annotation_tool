angular.module('CVGTool')

    .factory('adminUsersSrvc', function($state, $http, $httpParamSerializer) {

        return {
            getUsers: function (callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/user/getUsers'
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },

            getUsersByDataset: function (dataset, role,  callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/user/getUsersByDataset',
                    headers: {
                        dataset: dataset,
                        role: role
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },

            createUser: function (userName, userEmail, userRole, userDatasets, callbackSuccess, callbackMsg) {
                $http({
                    method: 'POST',
                    url: 'api/user/createUser',
                    data: {
                        'name': userName,
                        'email': userEmail,
                        'role': userRole,
                        'assignedTo': userDatasets
                    }
                }).then(function successCallback(response) {
                    callbackMsg('finish', 'User created succesfully', 'success');
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackMsg('finish', 'Error while creating user: ' + response.data.msg, 'danger');
                })
            },

            updateUser: function(oldName, userName, userEmail, userRole, userDatasets, callbackUsers, callbackMsg) {
                $http({
                    method: 'POST',
                    url: 'api/user/updateUser',
                    data: {
                        'name': userName,
                        'email': userEmail,
                        'role': userRole,
                        'assignedTo': userDatasets,
                        'oldName': oldName
                    }
                }).then(function successCallback(response) {
                    callbackUsers();
                    callbackMsg('finish', 'User updated succesfully', 'success');
                }, function errorCallback(response) {
                    callbackMsg('finish', 'Error while updating user: ' + response.data.msg, 'danger');
                })
            },

            removeUser: function(userName, showSuccess, showError) {
                $http({
                    method:'POST',
                    url: 'api/user/removeUser',
                    data: {
                        'name': userName
                    }
                }).then(function successCallback(response) {
                    showSuccess();
                }, function errorCallback(response) {
                    showError()
                })
            }
        }
    });
