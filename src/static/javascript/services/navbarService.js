angular.module('CVGTool')
    .factory('navSrvc', function($state, $http, $httpParamSerializer) {
        var user = {
            name: "",
            role: "",
            email: "",
            assignedTo: []
        };

        var activeDataset = { // Active dataset selected
            name: "",
            type: ""
        };

        return {
            // Logout function
            logout: function() {
                user.name = "";
                user.role = "";
                user.email = "";
                user.assignedTo = [];
                activeDataset = "";
                $state.go('login');
            },

            // Returns info of stored user
            getUser: function() {
                return user;
            },

            // Return role of the stored user
            getUserRole: function() {
                return user.role;
            },

            // Return current active dataset
            getActiveDataset: function() {
                if (user.role === "root") {
                    return {
                        name: "root",
                        type: "root"
                    }
                } else return activeDataset;
            },

            // Return true iff the type of the active dataset is posetrack
            isPosetrack: function() {
                return activeDataset.type.localeCompare("poseTrack") === 0;
            },

            // Set user to u
            setUser: function(u) {
                user.name = u.name;
                user.role = u.role;
                user.email = u.email;
                user.assignedTo = u.assignedTo;
            },

            // Set active dataset to dataset
            setActiveDataset: function(dataset) {
                activeDataset = {
                    name: dataset.name,
                    type: dataset.type,
                    dim: dataset.keypointDim
                };
            }
        }
    });