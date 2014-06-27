(function () {
    "use strict";

    /**
     * @param $scope
     * @param {AlertService} alertService
     * @param {ProductService} productService
     * @param {BillingService} billingService
     * @constructor
     */
    function BonController($scope, alertService, productService, billingService) {
        productService.getProducts().then(function (products) {
            $scope.products = products;
        });

        $scope.entries = [];

        resetSelected();

        $scope.$on(productService.$productAdded, function (event, product) {
            $scope.products.push(product);

            alertService.show('Neues Produkt verfügbar!', 'Das Produkt ' + product.name + ' wurde soeben hinzugefügt.');
        });

        $scope.$on(productService.$productChanged, function (event, product) {
            for (var i = 0; i < $scope.products.length; i++) {
                var item = $scope.products[i];
                if (item.id === product.id) {
                    angular.extend(item, product);
                    return;
                }
            }
        });

        $scope.$watch('entries', function (newVal) {
            var sum = 0;
            for (var i = 0; i < newVal.length; i++) {
                sum += newVal[i].sum;
            }

            $scope.amount = sum;
        }, true);

        $scope.$watch('selected.product', function (newValue) {
            if (newValue) {
                if (!$scope.form.price.$dirty) {
                    $scope.selected.price = newValue.price;
                }
            }
        });

        $scope.countDown = function () {
            if ($scope.selected.count > 1) {
                $scope.selected.count--;
            }
        };

        $scope.countUp = function () {
            $scope.selected.count++;
        };

        function resetNumberPad() {
            $scope.numberEntry = null;
            $scope.$broadcast('numberpad:value', 0);
        }

        function resetSelected() {
            $scope.selected = { count: 1 };
        }

        $scope.edit = function (entry, index) {
            if (entry.remove) {
                return;
            }

            entry.$index = index;
            entry.previousCount = entry.count;

            $scope.numberEntry = null;
            $scope.$broadcast('numberpad:value', 0);

            $scope.selected = angular.extend({}, entry);
        };

        $scope.cancel = function () {
            resetSelected();
        };

        $scope.add = function () {
            var entry = $scope.selected;
            resetSelected();

            entry.text = entry.product.name;
            entry.sum = entry.count * entry.price;

            billingService.addEntry(entry);

            $scope.entries.push(entry);
        };

        $scope.change = function () {
            var entry = $scope.selected;
            resetSelected();

            entry.text = entry.product.name;
            entry.sum = entry.count * entry.price;

            billingService.changeEntry(entry);

            var index = entry.$index;
            delete entry.$index;

            angular.extend($scope.entries[index], entry);
        };

        $scope.remove = function (entry, index) {
            billingService.removeEntry(entry);

            entry.remove = true;

            resetNumberPad();
            resetSelected();

            $scope.entries.splice(index, 1);
        };

        $scope.number = function (value) {
            if ($scope.numberEntry) {
                var changeEntry = $scope.numberEntry;
                $scope.numberEntry = null;

                changeEntry.previousCount = changeEntry.count;

                switch ($scope.changeMode) {
                    case 'count':
                        changeEntry.count = value;
                        billingService.changeEntry(changeEntry);
                        break;
                    case 'price':
                        changeEntry.price = value;
                        billingService.changeEntry(changeEntry);
                        break;
                }

                changeEntry.sum = changeEntry.count * changeEntry.price;
            } else {
                var addEntry = {
                    product: {},
                    text: 'Sonderposition',
                    count: 1,
                    price: value,
                    sum: value
                };

                billingService.addEntry(addEntry);
                $scope.entries.push(addEntry);
            }
        };

        $scope.changeCount = function (event, entry) {
            event.stopPropagation();

            $scope.numberEntry = entry;
            $scope.changeMode = 'count';

            resetSelected();

            $scope.$broadcast('numberpad:value', entry.count);
        };

        $scope.changePrice = function (event, entry) {
            event.stopPropagation();

            $scope.numberEntry = entry;
            $scope.changeMode = 'price';

            resetSelected();

            $scope.$broadcast('numberpad:value', entry.price);
        };

        $scope.amount = 0;
    }

    app.module.controller('bonController', BonController);
})();
