angular.module('CVGTool')
    // include the 'navbar.html' into the <navbar> tag
    .directive('navbar', function() {
        return {
            restrict: 'E',
            templateUrl: 'static/views/navbar/navbar.html',
            controller: 'navbarCtrl'
        }
    })

// Control the draggability of some of the floating items
.directive('ngDraggable', function($document) {
    return {
        restrict: 'A',
        scope: {
            dragOptions: '=ngDraggable'
        },
        link: function(scope, elem, attr) {
            var startX, startY, x = 0,
                y = 0,
                start, stop, drag;

            var width = elem[0].offsetWidth,
                height = elem[0].offsetHeight;

            var parent = elem[0].parentNode;

            // Obtain drag options
            if (scope.dragOptions) {
                start = scope.dragOptions.start;
                drag = scope.dragOptions.drag;
                stop = scope.dragOptions.stop;
            }

            // Bind mousedown event
            elem.on('mousedown', function(e) {
                e.preventDefault();
                startX = e.clientX - parent.offsetLeft;
                startY = e.clientY - parent.offsetTop;

                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
                if (start) start(e);
            });

            // Handle drag event
            function mousemove(e) {
                y = e.clientY - startY;
                x = e.clientX - startX;
                setPosition();
                if (drag) drag(e);
            }

            // Unbind drag events
            function mouseup(e) {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
                if (stop) stop(e);
            }

            // Move element
            function setPosition() {
                // Control that the element is inside the width and height of the screen
                if (x < 0) x = 0;
                if (y < 50) y = 50;
                // if (x + parent.clientWidth > body.width()) x = body.width() - parent.clientWidth;
                // if (y + parent.height > $document.height) y = $document.height - parent.height;
                parent.style.top = y + 'px';
                parent.style.left = x + 'px';
            }
        }
    }
});