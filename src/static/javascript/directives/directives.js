angular.module('CVGTool')
// include the 'navbar.html' into the <navbar> tag
    .directive('navbar', function () {
        return {
            restrict: 'E',
            templateUrl: 'static/views/navbar/navbar.html',
            controller: 'navbarCtrl'
        }
});
