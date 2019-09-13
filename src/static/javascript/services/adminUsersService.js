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

            createUser: function (userName, userEmail, userRole, userDatasets, callbackSuccess, callbackError) {
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
                    console.log('User created successfully');
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError('danger', 'Error while creating user: ' + response.data.msg);
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
                    callbackMsg('success', 'User updated succesfully');
                }, function errorCallback(response) {
                    callbackMsg('danger', 'Error while updating user: ' + response.data.msg);
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
