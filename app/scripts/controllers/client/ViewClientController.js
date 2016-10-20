(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewClientController: function (scope, routeParams, route, location, resourceFactory, http, $modal, API_VERSION, $rootScope, $upload) {
            scope.client = [];
            scope.identitydocuments = [];
            scope.buttons = [];
            scope.clientdocuments = [];
            scope.staffData = {};
            scope.formData = {};
            scope.openLoan = true;
            scope.openSaving = true;
            scope.openShares = true ;
            scope.updateDefaultSavings = false;
            scope.charges = [];
            scope.showClosedPledges = false;
            scope.id = routeParams.id;
            scope.pledges = [];
            scope.dob = "label.input.dateofbirth";
            scope.addressData = [];
            scope.addressId ;
            scope.enableClientAddress = false;
            scope.loancycledetail = [];
            scope.routeToLoan = function (id) {
                location.path('/viewloanaccount/' + id);
            };
            scope.routeToLoanApplication = function (loanAppData) {
                location.path('/viewloanapplicationreference/' + loanAppData.loanApplicationReferenceId);
            };
            scope.routeToChargeOverview = function () {
                location.path(scope.pathToChargeOverview());
            };

            scope.pathToChargeOverview =function (){
                return ('/viewclient/'+ scope.client.id + '/chargeoverview');
            }

            scope.routeToCharge = function (chargeId) {
                location.path('/viewclient/'+ scope.client.id + '/charges/' + chargeId);
            };

            scope.routeToSaving = function (id, depositTypeCode) {
                if (depositTypeCode === "depositAccountType.savingsDeposit") {
                    location.path('/viewsavingaccount/' + id);
                } else if (depositTypeCode === "depositAccountType.fixedDeposit") {
                    location.path('/viewfixeddepositaccount/' + id);
                } else if (depositTypeCode === "depositAccountType.recurringDeposit") {
                    location.path('/viewrecurringdepositaccount/' + id);
                }
            };

            scope.routeToShareAccount = function(id) {
                location.path('/viewshareaccount/'+id)
            } ;

            scope.haveFile = [];
            resourceFactory.clientResource.get({clientId: routeParams.id}, function (data) {
                scope.client = data;
                $rootScope.clientname=data.displayName;
                scope.isClosedClient = scope.client.status.value == 'Closed';
                scope.staffData.staffId = data.staffId;
                if (data.imagePresent) {
                    http({
                        method: 'GET',
                        url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/images?maxHeight=150'
                    }).then(function (imageData) {
                        scope.image = imageData.data;
                    });
                }
               

                http({
                    method: 'GET',
                    url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/documents'
                }).then(function (docsData) {
                    var docId = -1;
                    for (var i = 0; i < docsData.data.length; ++i) {
                        if (docsData.data[i].name == 'clientSignature') {
                            docId = docsData.data[i].id;
                            scope.signature_url = $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/documents/' + docId + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                        }
                    }
                });

                scope.navigateToSavingsOrDepositAccount = function (eventName, accountId, savingProductType) {
                    switch(eventName) {

                        case "deposit":
                            if(savingProductType==100)
                                location.path('/savingaccount/' + accountId + '/deposit');
                            if(savingProductType==300)
                                location.path('/recurringdepositaccount/' + accountId + '/deposit');
                            break;
                        case "withdraw":
                            if(savingProductType==100)
                                location.path('/savingaccount/' + accountId + '/withdrawal');
                            if(savingProductType==300)
                                location.path('/recurringdepositaccount/' + accountId + '/withdrawal');
                            break;
                    }
                }

                
                var clientStatus = new mifosX.models.ClientStatus();

                if (clientStatus.statusKnown(data.status.value)) {
                    scope.buttons = clientStatus.getStatus(data.status.value);
                    scope.savingsActionbuttons = [
                            {
                                name: "button.deposit",
                                type: "100",
                                icon: "icon-arrow-right",
                                taskPermissionName: "DEPOSIT_SAVINGSACCOUNT"
                            },
                            {
                                name: "button.withdraw",
                                type: "100",
                                icon: "icon-arrow-left",
                                taskPermissionName: "WITHDRAW_SAVINGSACCOUNT"
                            },
                            {
                                name: "button.deposit",
                                type: "300",
                                icon: "icon-arrow-right",
                                taskPermissionName: "DEPOSIT_RECURRINGDEPOSITACCOUNT"
                            },
                            {
                                name: "button.withdraw",
                                type: "300",
                                icon: "icon-arrow-left",
                                taskPermissionName: "WITHDRAW_RECURRINGDEPOSITACCOUNT"
                            }
                        ];
                }

                if (data.status.value == "Pending" || data.status.value == "Active") {
                    if (data.staffId) {

                    }
                    else {
                        scope.buttons.push(clientStatus.getStatus("Assign Staff"));
                    }
                }

                scope.buttonsArray = {
                    options: [
                        {
                            name: "button.clientscreenreports"
                        }
                    ]
                };

                scope.buttonsArray.singlebuttons = scope.buttons;

                resourceFactory.runReportsResource.get({reportSource: 'ClientSummary', genericResultSet: 'false', R_clientId: routeParams.id}, function (data) {
                    scope.client.ClientSummary = data[0];
                    scope.loancycledetail = data;
                });

                resourceFactory.DataTablesResource.getAllDataTables({apptable: 'm_client', id: routeParams.id}, function (data) {
                    scope.clientdatatables = data;
                });

                resourceFactory.loanApplicationReferencesResource.getByClientId({clientId: routeParams.id}, function (data) {
                    scope.loanApplications = data;
                });

                resourceFactory.clientAccountResource.get({clientId: routeParams.id}, function (data) {
                    scope.clientAccounts = data;
                    scope.pledges = scope.clientAccounts.pledges;
                    if (data.savingsAccounts) {
                        for (var i in data.savingsAccounts) {
                            if (data.savingsAccounts[i].status.value == "Active") {
                                scope.updateDefaultSavings = true;
                                break;
                            }
                        }
                    }
                    resourceFactory.clientChargesResource.getCharges({clientId: routeParams.id, pendingPayment:true}, function (data) {
                        scope.charges = data.pageItems;


                    });
                });

            });
            scope.deleteClient = function () {
                $modal.open({
                    templateUrl: 'deleteClient.html',
                    controller: ClientDeleteCtrl
                });
            };
            scope.uploadPic = function () {
                $modal.open({
                    templateUrl: 'uploadpic.html',
                    controller: UploadPicCtrl
                });
            };
            var UploadPicCtrl = function ($scope, $modalInstance) {
                $scope.onFileSelect = function ($files) {
                    scope.file = $files[0];
                };
                $scope.upload = function () {
                    if (scope.file) {
                        $upload.upload({
                            url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/images',
                            data: {},
                            file: scope.file
                        }).then(function (imageData) {
                            // to fix IE not refreshing the model
                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                            $modalInstance.close('upload');
                            route.reload();
                        });
                    }
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };
            scope.capturePic = function () {
                $modal.open({
                    templateUrl: 'capturepic.html',
                    controller: CapturePicCtrl,
                    windowClass: 'modalwidth700'
                });
            };
            var CapturePicCtrl = function ($scope, $modalInstance) {

                $scope.video = null;
                $scope.picture = null;
                $scope.error = null;

                $scope.onVideoSuccess = function (video) {
                    $scope.video = video;
                    $scope.error = null;
                };

                $scope.onVideoError = function (err) {
                    if(typeof err != "undefined")
                        $scope.error = err.message + '(' + err.name + ')';
                };

                $scope.takeScreenshot = function () {
                    var picCanvas = document.createElement('canvas');
                    var width = $scope.video.width;
                    var height = $scope.video.height;

                    picCanvas.width = width;
                    picCanvas.height = height;
                    var ctx = picCanvas.getContext("2d");
                    ctx.drawImage($scope.video, 0, 0, width, height);
                    var imageData = ctx.getImageData(0, 0, width, height);
                    document.querySelector('#clientSnapshot').getContext("2d").putImageData(imageData, 0, 0);
                    $scope.picture = picCanvas.toDataURL();
                };
                $scope.uploadscreenshot = function () {
                    if($scope.picture != null) {
                        http({
                            method: 'POST',
                            url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/images',
                            data: $scope.picture
                        }).then(function (imageData) {
                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                            $modalInstance.close('upload');
                            route.reload();
                        });
                    }
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
                $scope.reset = function () {
                    $scope.picture = null;
                }
            };
            scope.deletePic = function () {
                $modal.open({
                    templateUrl: 'deletePic.html',
                    controller: DeletePicCtrl
                });
            };
            var DeletePicCtrl = function ($scope, $modalInstance) {
                $scope.delete = function () {
                    http({
                        method: 'DELETE',
                        url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/images',
                    }).then(function (imageData) {
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                        $modalInstance.close('delete');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };
            scope.uploadSig = function () {
                $modal.open({
                    templateUrl: 'uploadsig.html',
                    controller: UploadSigCtrl
                });
            };
            var UploadSigCtrl = function ($scope, $modalInstance) {
                $scope.onFileSelect = function ($files) {
                    scope.file = $files[0];
                };
                $scope.upload = function () {
                    if (scope.file) {
                        $upload.upload({
                            url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/documents',
                            data: {
                                name: 'clientSignature',
                                description: 'client signature'
                            },
                            file: scope.file,
                        }).then(function (imageData) {
                                // to fix IE not refreshing the model
                                if (!scope.$$phase) {
                                    scope.$apply();
                                }
                                $modalInstance.close('upload');
                                route.reload();
                            });
                    }
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            scope.unassignStaffCenter = function () {
                $modal.open({
                    templateUrl: 'clientunassignstaff.html',
                    controller: ClientUnassignCtrl
                });
            };
            var ClientDeleteCtrl = function ($scope, $modalInstance) {
                $scope.delete = function () {
                    resourceFactory.clientResource.delete({clientId: routeParams.id}, {}, function (data) {
                        $modalInstance.close('delete');
                        location.path('/clients');
                    });
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };
            var ClientUnassignCtrl = function ($scope, $modalInstance) {
                $scope.unassign = function () {
                    resourceFactory.clientResource.save({clientId: routeParams.id, command: 'unassignstaff'}, scope.staffData, function (data) {
                        $modalInstance.close('unassign');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            scope.isClosed = function (loanaccount) {
                if (loanaccount.status.code === "loanStatusType.closed.written.off" ||
                    loanaccount.status.code === "loanStatusType.closed.obligations.met" ||
                    loanaccount.status.code === "loanStatusType.closed.reschedule.outstanding.amount" ||
                    loanaccount.status.code === "loanStatusType.withdrawn.by.client" ||
                    loanaccount.status.code === "loanStatusType.rejected") {
                    return true;
                } else {
                    return false;
                }
            };
            scope.isSavingClosed = function (savingaccount) {
                if (savingaccount.status.code === "savingsAccountStatusType.withdrawn.by.applicant" ||
                    savingaccount.status.code === "savingsAccountStatusType.closed" ||
                    savingaccount.status.code === "savingsAccountStatusType.pre.mature.closure" ||
                    savingaccount.status.code === "savingsAccountStatusType.rejected") {
                    return true;
                } else {
                    return false;
                }
            };

            scope.isShareClosed = function (shareAccount) {
                if ( shareAccount.status.code === "shareAccountStatusType.closed" ||
                    shareAccount.status.code === "shareAccountStatusType.rejected") {
                    return true;
                } else {
                    return false;
                }
            };
            scope.setLoan = function () {
                if (scope.openLoan) {
                    scope.openLoan = false
                } else {
                    scope.openLoan = true;
                }
            };
            scope.setSaving = function () {
                if (scope.openSaving) {
                    scope.openSaving = false;
                } else {
                    scope.openSaving = true;
                }
            };

            scope.isGetAllClientsNotes = false;
            scope.getAllClientsNotes = function () {
                if(!scope.isGetAllClientsNotes){
                    resourceFactory.clientNotesResource.getAllNotes({clientId: routeParams.id}, function (data) {
                        scope.clientNotes = data;
                        scope.isGetAllClientsNotes = true;
                    });
                }
            }

            scope.setShares = function () {
                if (scope.openShares) {
                    scope.openShares = false;
                } else {
                    scope.openShares = true;
                }
            };

            var addressConfig = 'enable-clients-address';
            resourceFactory.configurationResource.get({configName: addressConfig}, function (response) {
                if (response.enabled == true) {
                    scope.enableClientAddress = true;
                    scope.fetchEntityAddress();
                } else {
                    scope.enableClientAddress = false;
                }
            });

            resourceFactory.configurationResource.get({configName: 'enable-beta'}, function (response) {
                scope.isBetaEnabled = response.enabled;
            });

            scope.fetchEntityAddress = function () {
                scope.entityType = "clients";
                resourceFactory.addressDataResource.getAll({
                    entityType: scope.entityType,
                    entityId: routeParams.id
                }, function (response) {
                    if (response != null) {
                        scope.addressData = response;
                    }
                });
            }
            scope.deleteAddress = function (addressId) {
                scope.addressId = addressId;
                $modal.open({
                    templateUrl: 'deleteaddress.html',
                    controller: AddressDeleteCtrl
                });
            };

            var AddressDeleteCtrl = function ($scope, $modalInstance) {
                $scope.delete = function () {
                    resourceFactory.entityAddressResource.delete({entityType: scope.entityType, entityId: routeParams.id, addressId: scope.addressId}, function (response) {
                        $modalInstance.close('delete');
                        if(response != null) {
                            route.reload();
                        }
                    });
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };
            scope.getClientIdentityDocuments = function () {
                resourceFactory.clientResource.getAllClientDocuments({clientId: routeParams.id, anotherresource: 'identifiers'}, function (data) {
                    scope.identitydocuments = data;
                    for (var i = 0; i < scope.identitydocuments.length; i++) {
                        resourceFactory.clientIdentifierResource.get({clientIdentityId: scope.identitydocuments[i].id}, function (data) {
                            for (var j = 0; j < scope.identitydocuments.length; j++) {
                                if (data.length > 0 && scope.identitydocuments[j].id == data[0].parentEntityId) {
                                    for (var l in data) {

                                        var loandocs = {};
                                        loandocs = API_VERSION + '/' + data[l].parentEntityType + '/' + data[l].parentEntityId + '/documents/' + data[l].id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                                        data[l].docUrl = loandocs;
                                    }
                                    scope.identitydocuments[j].documents = data;
                                }
                            }
                        });
                    }
                });
            };

            scope.dataTableChange = function (clientdatatable) {
                resourceFactory.DataTablesResource.getTableDetails({datatablename: clientdatatable.registeredTableName,
                    entityId: routeParams.id, genericResultSet: 'true'}, function (data) {
                    scope.datatabledetails = data;
                    scope.datatabledetails.isData = data.data.length > 0 ? true : false;
                    scope.datatabledetails.isMultirow = data.columnHeaders[0].columnName == "id" ? true : false;
                    scope.showDataTableAddButton = !scope.datatabledetails.isData || scope.datatabledetails.isMultirow;
                    scope.showDataTableEditButton = scope.datatabledetails.isData && !scope.datatabledetails.isMultirow;
                    scope.singleRow = [];
                    for (var i in data.columnHeaders) {
                        if (scope.datatabledetails.columnHeaders[i].columnCode) {
                            for (var j in scope.datatabledetails.columnHeaders[i].columnValues) {
                                for (var k in data.data) {
                                    if (data.data[k].row[i] == scope.datatabledetails.columnHeaders[i].columnValues[j].id) {
                                        data.data[k].row[i] = scope.datatabledetails.columnHeaders[i].columnValues[j].value;
                                    }
                                }
                            }
                        }
                    }
                    if (scope.datatabledetails.isData) {
                        for (var i in data.columnHeaders) {
                            if (!scope.datatabledetails.isMultirow) {
                                var row = {};
                                row.key = data.columnHeaders[i].columnName;
                                row.value = data.data[0].row[i];
                                scope.singleRow.push(row);
                            }
                        }
                    }
                });
            };

            scope.viewstandinginstruction = function () {
                location.path('/liststandinginstructions/' + scope.client.officeId + '/' + scope.client.id);
            };
            scope.createstandinginstruction = function () {
                location.path('/createstandinginstruction/' + scope.client.officeId + '/' + scope.client.id + '/fromsavings');
            };
            scope.deleteAll = function (apptableName, entityId) {
                resourceFactory.DataTablesResource.delete({datatablename: apptableName, entityId: entityId, genericResultSet: 'true'}, {}, function (data) {
                    route.reload();
                });
            };

            scope.getClientDocuments = function () {
                resourceFactory.clientDocumentsResource.getAllClientDocuments({clientId: routeParams.id}, function (data) {
                    for (var l in data) {

                        var loandocs = {};
                        loandocs = API_VERSION + '/' + data[l].parentEntityType + '/' + data[l].parentEntityId + '/documents/' + data[l].id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                        data[l].docUrl = loandocs;
                    }
                    scope.clientdocuments = data;
                });
            };

            scope.deleteDocument = function (documentId, index) {
                resourceFactory.clientDocumentsResource.delete({clientId: routeParams.id, documentId: documentId}, '', function (data) {
                    scope.clientdocuments.splice(index, 1);
                });
            };

            scope.viewDataTable = function (registeredTableName, data) {
                if (scope.datatabledetails.isMultirow) {
                    location.path("/viewdatatableentry/" + registeredTableName + "/" + scope.client.id + "/" + data.row[0]);
                } else {
                    location.path("/viewsingledatatableentry/" + registeredTableName + "/" + scope.client.id);
                }
            };

            scope.downloadDocument = function (documentId) {
                resourceFactory.clientDocumentsResource.get({clientId: routeParams.id, documentId: documentId}, '', function (data) {
                    scope.clientdocuments.splice(index, 1);
                });
            };

            scope.isLoanNotClosed = function (loanaccount) {
                if (loanaccount.status.code === "loanStatusType.closed.written.off" ||
                    loanaccount.status.code === "loanStatusType.closed.obligations.met" ||
                    loanaccount.status.code === "loanStatusType.closed.reschedule.outstanding.amount" ||
                    loanaccount.status.code === "loanStatusType.withdrawn.by.client" ||
                    loanaccount.status.code === "loanStatusType.rejected") {
                    return false;
                } else {
                    return true;
                }
            };

            scope.loanAppStatusId = 400;
            scope.isLoanAppIncompleted = function (loanAddData) {
                if (loanAddData.status.id < scope.loanAppStatusId) {
                    return true;
                } else {
                    return false;
                }
            };

            scope.isSavingNotClosed = function (savingaccount) {
                if (savingaccount.status.code === "savingsAccountStatusType.withdrawn.by.applicant" ||
                    savingaccount.status.code === "savingsAccountStatusType.closed" ||
                    savingaccount.status.code === "savingsAccountStatusType.pre.mature.closure" ||
                    savingaccount.status.code === "savingsAccountStatusType.rejected") {
                    return false;
                } else {
                    return true;
                }
            };

            scope.isShareNotClosed = function (shareAccount) {
                if ( shareAccount.status.code === "shareAccountStatusType.closed" ||
                    shareAccount.status.code === "shareAccountStatusType.rejected") {
                    return false;
                } else {
                    return true;
                }
            };
            scope.saveNote = function () {
                resourceFactory.clientResource.save({clientId: routeParams.id, anotherresource: 'notes'}, this.formData, function (data) {
                    var today = new Date();
                    temp = { id: data.resourceId, note: scope.formData.note, createdByUsername: "test", createdOn: today };
                    scope.clientNotes.push(temp);
                    scope.formData.note = "";
                    scope.predicate = '-id';
                });
            }

            scope.deleteClientIdentifierDocument = function (clientId, entityId, index) {
                resourceFactory.clientIdenfierResource.delete({clientId: clientId, id: entityId}, '', function (data) {
                    scope.identitydocuments.splice(index, 1);
                });
            };

            scope.downloadClientIdentifierDocument = function (identifierId, documentId) {
                console.log(identifierId, documentId);
            };

            scope.waiveCharge = function(chargeId){
                resourceFactory.clientChargesResource.waive({clientId: routeParams.id, resourceType:chargeId}, function (data) {
                    route.reload();
                });
            }

            scope.showSignature = function()
            {
                $modal.open({
                    templateUrl: 'clientSignature.html',
                    controller: ViewLargerClientSignature,
                    size: "lg"
                });
             };

            scope.showWithoutSignature = function()
            {
                $modal.open({
                    templateUrl: 'clientWithoutSignature.html',
                    controller: ViewClientWithoutSignature,
                    size: "lg"
                });
            };

            scope.showPicture = function () {
                $modal.open({
                    templateUrl: 'photo-dialog.html',
                    controller: ViewLargerPicCtrl,
                    size: "lg"
                });
            };

            var ViewClientWithoutSignature = function($scope,$modalInstance){
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };
            var ViewLargerClientSignature = function($scope,$modalInstance){
                    var loadSignature = function(){
                     http({
                        method: 'GET',
                        url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/documents'
                     }).then(function (docsData) {
                        var docId = -1;
                        for (var i = 0; i < docsData.data.length; ++i) {
                            if (docsData.data[i].name == 'clientSignature') {
                                docId = docsData.data[i].id;
                                scope.signature_url = $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/documents/' + docId + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                            }
                        }
                    if (scope.signature_url != null) {
                        http({
                            method: 'GET',
                            url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/documents/' + docId + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier
                    }).then(function (docsData) {
                            $scope.largeImage = scope.signature_url;
                        });
                    }
                    });
                };
                loadSignature();
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
             };

            var ViewLargerPicCtrl = function ($scope, $modalInstance) {
                var loadImage = function () {
                    if (scope.client.imagePresent) {
                        http({
                            method: 'GET',
                            url: $rootScope.hostUrl + API_VERSION + '/clients/' + routeParams.id + '/images?maxWidth=860'
                        }).then(function (imageData) {
                            $scope.largeImage = imageData.data;
                        });
                    }
                };
                loadImage();
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            }

            scope.deletePledge = function(id){
                resourceFactory.pledgeResource.delete({pledgeId: id}, function (data) {
                    resourceFactory.clientAccountResource.get({clientId: routeParams.id}, function (data) {
                        scope.pledges = data.pledges;
                    });
                });

            };

            scope.requestApprovalLoanAppRef = function (loanApplicationReferenceId) {
                resourceFactory.loanApplicationReferencesResource.update({
                    loanApplicationReferenceId: loanApplicationReferenceId,
                    command: 'requestforapproval'
                }, {}, function (data) {
                    location.path('/viewloanapplicationreference/' + loanApplicationReferenceId);
                });
            };

            scope.familyDetails = function(){
                resourceFactory.familyDetails.getAll({clientId: routeParams.id}, function (data) {
                    scope.familyMembers = data;
                });
            };

            scope.routeTo = function (id) {
                location.path('/clients/' + routeParams.id + '/viewfamilydetails/' + id);
            };

            scope.showEdit = function (id) {
                location.path('/clients/' + routeParams.id + '/editfamilydetails/' + id);
            };

            var FamilyDetailsDeleteCtrl = function ($scope, $modalInstance, familyDetailsId) {
                $scope.delete = function () {
                    resourceFactory.familyDetails.delete({
                        clientId: scope.id,
                        familyDetailId: familyDetailsId
                    }, {}, function (data) {
                        $modalInstance.close('delete');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };
            scope.deleteFamilyDetail = function (id) {
                $modal.open({
                    templateUrl: 'deletefamilydetail.html',
                    controller: FamilyDetailsDeleteCtrl,
                    resolve: {
                        familyDetailsId: function () {
                            return id;
                        }
                    }
                });
            };
            scope.incomeAndexpense = function(){
                resourceFactory.incomeExpenseAndHouseHoldExpense.getAll({clientId: routeParams.id},function(data){
                    scope.incomeAndExpenses = data;
                    scope.totalIncomeOcc = scope.calculateOccupationTotal();
                    scope.totalIncomeAsset = scope.calculateTotalAsset();
                    scope.totalHouseholdExpense = scope.calculateTotalExpense();
                });
            };

            scope.calculateOccupationTotal = function(){
                var total = 0;
                angular.forEach(scope.incomeAndExpenses, function(data){
                    if(!_.isUndefined(data.incomeExpenseData.cashFlowCategoryData.categoryEnum) && data.incomeExpenseData.cashFlowCategoryData.categoryEnum.id == 1){
                        if(!_.isUndefined(data.totalIncome) && !_.isNull(data.totalIncome)){
                            total = total + data.totalIncome;
                        }
                    }
                });
                return total;
            };

            scope.calculateTotalAsset = function(){
                var total = 0;
                angular.forEach(scope.incomeAndExpenses, function(data){
                    if(!_.isUndefined(data.incomeExpenseData.cashFlowCategoryData.categoryEnum) && data.incomeExpenseData.cashFlowCategoryData.categoryEnum.id == 2){
                        if(!_.isUndefined(data.totalIncome) && !_.isNull(data.totalIncome)){
                            total = total + data.totalIncome;
                        }
                    }
                });
                return total;
            };

            scope.calculateTotalExpense = function(){
                var total = 0;
                angular.forEach(scope.incomeAndExpenses, function(data){
                    if(!_.isUndefined(data.incomeExpenseData.cashFlowCategoryData.typeEnum) && data.incomeExpenseData.cashFlowCategoryData.typeEnum.id == 2){
                        if(!_.isUndefined(data.totalExpense) && !_.isNull(data.totalExpense)){
                            total = total + data.totalExpense;
                        }
                    }
                });
                return total;
            };

            scope.showEditClientIncome = function(id){
                location.path('/client/'+scope.id+'/editclientoccupation/'+id);
            };

            scope.showEditClientAsset = function(id){
                location.path('/client/'+scope.id+'/editclientasset/'+id);
            };

            scope.showEditClientHouseHoldExpense = function(id){
                location.path('/client/'+scope.id+'/editclienthouseholdexpense/'+id);
            };

            scope.existingLoans = function(){
              resourceFactory.clientExistingLoan.getAll({clientId: routeParams.id}, function(data){
                  scope.existingLoans = data;
              });
            };

            scope.showEditClientExistLoan = function(id){
                location.path('/client/'+scope.id+'/editclientexistingloan/'+id);
            }

            scope.routeToViewExistingLoan = function(id){
                location.path('/client/'+scope.id+'/viewclientexistingloan/'+id);
            }
        }
    });

    mifosX.ng.application.controller('ViewClientController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$modal', 'API_VERSION', '$rootScope', '$upload', mifosX.controllers.ViewClientController]).run(function ($log) {
        $log.info("ViewClientController initialized");
    });
}(mifosX.controllers || {}));
