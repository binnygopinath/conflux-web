(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewLoanDetailsController: function (scope, routeParams, resourceFactory, location, route, http, $modal, dateFilter, API_VERSION, $sce, $rootScope) {
            scope.loandocuments = [];
            scope.report = false;
            scope.hidePentahoReport = true;
            scope.formData = {};
            scope.date = {};
            scope.date.payDate = new Date();
            scope.hideTransactions = [];
            scope.hideTransactions.type =[];
            scope.hideTransactions.type.accrual = false;
            scope.loandetails = [];
            scope.addSubsidyTransactionTypeId = 50;
            scope.revokeSubsidyTransactionTypeId = 51;
            scope.glimClientsDetails = [];
            scope.isGlim = false;
            scope.waiveLink = "#/loanaccountcharge/{{loandetails.id}}/waivecharge/{{charge.id}}";

            scope.routeTo = function (loanId, transactionId, transactionTypeId) {
                if (transactionTypeId == 2 || transactionTypeId == 4 || transactionTypeId == 1
                    || transactionTypeId == scope.addSubsidyTransactionTypeId || transactionTypeId == scope.revokeSubsidyTransactionTypeId ) {
                    location.path('/viewloantrxn/' + loanId + '/trxnId/' + transactionId);
                }
                ;
            };
            scope.hideTransactionDetails = false;

            scope.clickEvent = function (eventName, accountId) {
                eventName = eventName || "";
                switch (eventName) {
                    case "addloancharge":
                        location.path('/addloancharge/' + accountId);
                        break;
                    case "addcollateral":
                        location.path('/addcollateral/' + accountId);
                        break;
                    case "assignloanofficer":
                        location.path('/assignloanofficer/' + accountId);
                        break;
                    case "modifyapplication":
                        location.path('/editloanaccount/' + accountId);
                        break;
                    case "approve":
                        location.path('/loanaccount/' + accountId + '/approve');
                        break;
                    case "reject":
                        location.path('/loanaccount/' + accountId + '/reject');
                        break;
                    case "withdrawnbyclient":
                        location.path('/loanaccount/' + accountId + '/withdrawnByApplicant');
                        break;
                    case "delete":
                        resourceFactory.LoanAccountResource.delete({loanId: accountId}, {}, function (data) {
                            var destination = '/viewgroup/' + data.groupId;
                            if (data.clientId) destination = '/viewclient/' + data.clientId;
                            location.path(destination);
                        });
                        break;
                    case "undoapproval":
                        location.path('/loanaccount/' + accountId + '/undoapproval');
                        break;
                    case "disburse":
                        location.path('/loanaccount/' + accountId + '/disburse');
                        break;
                    case "disbursetosavings":
                        location.path('/loanaccount/' + accountId + '/disbursetosavings');
                        break;
                    case "undodisbursal":
                        location.path('/loanaccount/' + accountId + '/undodisbursal');
                        break;
                    case "makerepayment":
                        location.path('/loanaccount/' + accountId + '/repayment');
                        break;
                    case "prepayment":
                        location.path('/loanaccount/' + accountId + '/prepayloan');
                        break;
                    case "waiveinterest":
                        location.path('/loanaccount/' + accountId + '/waiveinterest');
                        break;
                    case "writeoff":
                        location.path('/loanaccount/' + accountId + '/writeoff');
                        break;
                    case "recoverypayment":
                        location.path('/loanaccount/' + accountId + '/recoverypayment');
                        break;
                    case "close-rescheduled":
                        location.path('/loanaccount/' + accountId + '/close-rescheduled');
                        break;
                    case "transferFunds":
                        if (scope.loandetails.clientId) {
                            location.path('/accounttransfers/fromloans/' + accountId);
                        }
                        break;
                    case "close":
                        location.path('/loanaccount/' + accountId + '/close');
                        break;
                    case "createguarantor":
                        location.path('/guarantor/' + accountId);
                        break;
                    case "listguarantor":
                        location.path('/listguarantors/' + accountId);
                        break;
                    case "recoverguarantee":
                        location.path('/loanaccount/' + accountId + '/recoverguarantee');
                        break;
                    case "unassignloanofficer":
                        location.path('/loanaccount/' + accountId + '/unassignloanofficer');
                        break;
                    case "loanscreenreport":
                        location.path('/loanscreenreport/' + accountId);
                        break;
                    case "reschedule":
                        location.path('/loans/' +accountId + '/reschedule');
                        break;
                    case "adjustrepaymentschedule":
                        location.path('/adjustrepaymentschedule/'+accountId) ;
                        break ;
                    case "undolastdisbursal":
                        location.path('/loanaccount/' + accountId + '/undolastdisbursal');
                        break;
                    case "addsubsidy":
                        location.path('/loanaccount/' + accountId + '/addsubsidy');
                        break;
                    case "revokesubsidy":
                        location.path('/loanaccount/' + accountId + '/revokesubsidy');
                        break;
                    case "foreclosure":
                        location.path('loanforeclosure/' + accountId);
                        break;
                }
            };

            scope.delCharge = function (id) {
                $modal.open({
                    templateUrl: 'delcharge.html',
                    controller: DelChargeCtrl,
                    resolve: {
                        ids: function () {
                            return id;
                        }
                    }
                });
            };

            var DelChargeCtrl = function ($scope, $modalInstance, ids) {
                $scope.delete = function () {
                    resourceFactory.LoanAccountResource.delete({loanId: routeParams.id, resourceType: 'charges', chargeId: ids}, {}, function (data) {

                        $modalInstance.close('delete');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            scope.tabs = [
                { active: true },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false }
            ];


            /* For multiple disbursement loans, if second loan is due for disbursement, disburse button does not appearing,
                 hot fix is done by adding "associations: multiTranchDataRequest,isFetchSpecificData: true" in the first request itself
             */

            resourceFactory.LoanAccountResource.getLoanAccountDetails({loanId: routeParams.id,  associations: 'all', exclude: 'guarantors'}, function (data) {
                scope.loandetails = data;
                $rootScope.loanproductName = data.loanProductName;
                $rootScope.clientId=data.clientId;
                $rootScope.LoanHolderclientName=data.clientName;
                scope.convertDateArrayToObject('date');
                scope.recalculateInterest = data.recalculateInterest || true;
                scope.isWaived = scope.loandetails.repaymentSchedule.totalWaived > 0;
                scope.date.fromDate = new Date(data.timeline.actualDisbursementDate);
                scope.date.toDate = new Date();
                scope.status = data.status.value;
                scope.chargeAction = data.status.value == "Submitted and pending approval" ? true : false;
                scope.decimals = data.currency.decimalPlaces;
                if (scope.loandetails.charges) {
                    scope.charges = scope.loandetails.charges;
                    for (var i in scope.charges) {
                        if (scope.charges[i].paid || scope.charges[i].waived || scope.charges[i].chargeTimeType.value == 'Disbursement' || scope.loandetails.status.value != 'Active') {
                            var actionFlag = true;
                        }
                        else {
                            var actionFlag = false;
                        }
                        scope.charges[i].actionFlag = actionFlag;
                    }

                    scope.chargeTableShow = true;
                }
                else {
                    scope.chargeTableShow = false;
                }
                if (scope.status == "Submitted and pending approval" || scope.status == "Active" || scope.status == "Approved") {
                    scope.choice = true;
                }
                if (data.status.value == "Submitted and pending approval") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.addloancharge",
                            icon: "icon-plus-sign",
                            taskPermissionName: 'CREATE_LOANCHARGE'
                        },
                        {
                            name: "button.approve",
                            icon: "icon-ok",
                            taskPermissionName: 'APPROVE_LOAN'
                        },
                        {
                            name: "button.modifyapplication",
                            icon: "icon-edit",
                            taskPermissionName: 'UPDATE_LOAN'
                        },
                        {
                            name: "button.reject",
                            icon: "icon-remove",
                            taskPermissionName: 'REJECT_LOAN'
                        }
                    ],
                        options: [
                            {
                                name: "button.assignloanofficer",
                                taskPermissionName: 'UPDATELOANOFFICER_LOAN'
                            },
                            {
                                name: "button.withdrawnbyclient",
                                taskPermissionName: 'WITHDRAW_LOAN'
                            },
                            {
                                name: "button.delete",
                                taskPermissionName: 'DELETE_LOAN'
                            },
                            {
                                name: "button.addcollateral",
                                taskPermissionName: 'CREATE_COLLATERAL'
                            },
                            {
                                name: "button.listguarantor",
                                taskPermissionName: 'READ_GUARANTOR'
                            },
                            {
                                name: "button.createguarantor",
                                taskPermissionName: 'CREATE_GUARANTOR'
                            },
                            {
                                name: "button.loanscreenreport",
                                taskPermissionName: 'READ_LOAN'
                            }
                        ]

                    };
                    if(data.isVariableInstallmentsAllowed) {
                        scope.buttons.options.push({
                            name: "button.adjustrepaymentschedule",
                            taskPermissionName: 'ADJUST_REPAYMENT_SCHEDULE'
                        }) ;
                    }
                }

                if (data.status.value == "Approved") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.assignloanofficer",
                            icon: "icon-user",
                            taskPermissionName: 'UPDATELOANOFFICER_LOAN'
                        },
                        {
                            name: "button.disburse",
                            icon: "icon-flag",
                            taskPermissionName: 'DISBURSE_LOAN'
                        },
                        {
                            name: "button.disbursetosavings",
                            icon: "icon-flag",
                            taskPermissionName: 'DISBURSETOSAVINGS_LOAN'
                        },
                        {
                            name: "button.undoapproval",
                            icon: "icon-undo",
                            taskPermissionName: 'APPROVALUNDO_LOAN'
                        }
                    ],
                        options: [
                            {
                                name: "button.addloancharge",
                                taskPermissionName: 'CREATE_LOANCHARGE'
                            },
                            {
                                name: "button.listguarantor",
                                taskPermissionName: 'READ_GUARANTOR'
                            },
                            {
                                name: "button.createguarantor",
                                taskPermissionName: 'CREATE_GUARANTOR'
                            },
                            {
                                name: "button.loanscreenreport",
                                taskPermissionName: 'READ_LOAN'
                            }
                        ]

                    };
                }

                if (data.status.value == "Active") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.addloancharge",
                            icon: "icon-plus-sign",
                            taskPermissionName: 'CREATE_LOANCHARGE'
                        },
                        {
                            name: "button.makerepayment",
                            icon: "icon-dollar",
                            taskPermissionName: 'REPAYMENT_LOAN'
                        },
                        {
                            name: "button.undodisbursal",
                            icon: "icon-undo",
                            taskPermissionName: 'DISBURSALUNDO_LOAN'
                        }
                    ],
                        options: [
                            {
                                name: "button.addsubsidy",
                                taskPermissionName: 'READ_SUBSIDY'
                            },
                            {
                                name: "button.waiveinterest",
                                taskPermissionName: 'WAIVEINTERESTPORTION_LOAN'
                            },
                            {
                                name: "button.reschedule",
                                taskPermissionName: 'CREATE_RESCHEDULELOAN'
                            },
                            {
                                name: "button.writeoff",
                                taskPermissionName: 'WRITEOFF_LOAN'
                            },
                            {
                                name: "button.close-rescheduled",
                                taskPermissionName: 'CLOSEASRESCHEDULED_LOAN'
                            },
                            {
                                name: "button.close",
                                taskPermissionName: 'CLOSE_LOAN'
                            },
                            {
                                name: "button.loanscreenreport",
                                taskPermissionName: 'READ_LOAN'
                            },
                            {
                                name: "button.listguarantor",
                                taskPermissionName: 'READ_GUARANTOR'
                            },
                            {
                                name: "button.createguarantor",
                                taskPermissionName: 'CREATE_GUARANTOR'
                            },
                            {
                                name: "button.recoverguarantee",
                                taskPermissionName: 'RECOVERGUARANTEES_LOAN'
                            },
                            {
                                name: "button.undolastdisbursal",
                                taskPermissionName: 'DISBURSALLASTUNDO_LOAN'
                            }
                        ]

                    };

                    for(var i = 0; i < scope.loandetails.transactions.length; i++){
                        if(scope.loandetails.transactions[i].type.value == "Add Subsidy"){
                            scope.buttons.options.unshift({
                                name: "button.revokesubsidy",
                                taskPermissionName: 'READ_SUBSIDY'
                            });
                            break;
                        }
                    }

                    for (var i = 0; i < scope.loandetails.transactions.length; i++) {
                        if (angular.isUndefined(scope.loandetails.interestRecalculationData) || !scope.loandetails.interestRecalculationData.isSubsidyApplicable) {
                            scope.buttons.options.splice(0, 1);
                            break;
                        }
                    }

                    if (data.canDisburse) {
                        scope.buttons.singlebuttons.splice(1, 0, {
                            name: "button.disburse",
                            icon: "icon-flag",
                            taskPermissionName: 'DISBURSE_LOAN'
                        });
                        scope.buttons.singlebuttons.splice(1, 0, {
                            name: "button.disbursetosavings",
                            icon: "icon-flag",
                            taskPermissionName: 'DISBURSETOSAVINGS_LOAN'
                        });
                    }
                    var count = 0;
                    for(var i in data.disbursementDetails){
                        if(data.disbursementDetails[i].actualDisbursementDate){
                            count++;
                        }
                    }
                    if(count <= 1){
                        scope.buttons.options.splice(scope.buttons.options.length-1,1);
                    }
                    //loan officer not assigned to loan, below logic
                    //helps to display otherwise not
                    if (!data.loanOfficerName) {
                        scope.buttons.singlebuttons.splice(1, 0, {
                            name: "button.assignloanofficer",
                            icon: "icon-user",
                            taskPermissionName: 'UPDATELOANOFFICER_LOAN'
                        });
                    }

                    if(scope.recalculateInterest && scope.loandetails.interestRecalculationData){
                        scope.hideTransactionDetails = scope.loandetails.interestRecalculationData.isCompoundingToBePostedAsTransaction || false;
                        scope.buttons.singlebuttons.splice(1, 0, {
                            name: "button.prepayment",
                            icon: "icon-money",
                            taskPermissionName: 'REPAYMENT_LOAN'
                        });
                    }else{
                        scope.buttons.singlebuttons.splice(1, 0, {
                            name: "button.foreclosure",
                            icon: "icon-money",
                            taskPermissionName: 'FORECLOSURE_LOAN'
                        });
                    }
                }
                if (data.status.value == "Overpaid") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.transferFunds",
                            icon: "icon-exchange",
                            taskPermissionName: 'CREATE_ACCOUNTTRANSFER'
                        }
                    ]
                    };
                }
                if (data.status.value == "Closed (written off)") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.recoverypayment",
                            icon: "icon-briefcase",
                            taskPermissionName: 'RECOVERYPAYMENT_LOAN'
                        }
                    ]
                    };
                }
                scope.isWriteOff = false;
                if(scope.loandetails.summary!=null) {
                    if (scope.loandetails.summary.writeoffReasonId != null) {
                        scope.isWriteOff = true;
                    }
                }
                //scope.getAllLoanNotes();
                scope.convertDateArrayToObject('date');
            });

            scope.isRepaymentSchedule = false;
            scope.istransactions = false;
            scope.iscollateral = false;
            scope.isMultiDisburseDetails = false;
            scope.isInterestRatesPeriods = false;
            scope.ischarges = false;
            scope.getSpecificData = function (associations){
                scope.isDataAlreadyFetched = false;
                if(associations === 'repaymentSchedule'){
                    associations = "repaymentSchedule,futureSchedule,originalSchedule";
                }
                if(associations === 'multiDisburseDetails'){
                    associations = "multiDisburseDetails,emiAmountVariations";
                }
                if((associations === 'repaymentSchedule'  || associations === 'repaymentSchedule,futureSchedule,originalSchedule' )&& scope.isRepaymentSchedule === true){
                    scope.isDataAlreadyFetched = true;
                }else if(associations === 'transactions' && scope.istransactions === true){
                    scope.isDataAlreadyFetched = true;
                }else if(associations === 'collateral' && scope.iscollateral === true){
                    scope.isDataAlreadyFetched = true;
                }else if(associations === 'multiDisburseDetails,emiAmountVariations' && scope.isMultiDisburseDetails === true){
                    scope.isDataAlreadyFetched = true;
                }else if(associations === 'interestRatesPeriods' && scope.isInterestRatesPeriods === true){
                    scope.isDataAlreadyFetched = true;
                }else if(associations === 'charges' && scope.ischarges === true){
                    scope.isDataAlreadyFetched = true;
                }
                if(!scope.isDataAlreadyFetched){
                    resourceFactory.LoanAccountResource.getLoanAccountDetails({loanId: routeParams.id, associations: associations,isFetchSpecificData: true}, function (data) {
                        scope.loanSpecificData = data;
                        if(associations === 'repaymentSchedule' || associations === 'repaymentSchedule,futureSchedule,originalSchedule'){
                            scope.isRepaymentSchedule = true;
                            scope.loandetails.originalSchedule = scope.loanSpecificData.originalSchedule;
                            scope.loandetails.repaymentSchedule = scope.loanSpecificData.repaymentSchedule;
                            scope.isWaived = scope.loandetails.repaymentSchedule.totalWaived > 0;
                        }else if(associations === 'transactions'){
                            scope.istransactions = true;
                            scope.loandetails.transactions = scope.loanSpecificData.transactions;
                            scope.convertDateArrayToObject('date');
                        }else if(associations === 'collateral'){
                            scope.iscollateral = true;
                            scope.loandetails.collateral = scope.loanSpecificData.collateral;
                        }else if(associations === 'multiDisburseDetails,emiAmountVariations'){
                            scope.isMultiDisburseDetails = true;
                            scope.loandetails.disbursementDetails = scope.loanSpecificData.disbursementDetails;
                            scope.loandetails.emiAmountVariations = scope.loanSpecificData.emiAmountVariations;
                        }else if(associations === 'interestRatesPeriods'){
                            scope.isInterestRatesPeriods = true;
                            scope.loandetails.interestRatesPeriods = scope.loanSpecificData.interestRatesPeriods;
                        }else if(associations === 'charges'){
                            scope.ischarges = true;
                            scope.loandetails.charges = scope.loanSpecificData.charges;
                            if (scope.loandetails.charges) {
                                scope.charges = scope.loandetails.charges;
                                for (var i in scope.charges) {
                                    if (scope.charges[i].paid || scope.charges[i].waived || scope.charges[i].chargeTimeType.value == 'Disbursement' || scope.loandetails.status.value != 'Active') {
                                        var actionFlag = true;
                                    }
                                    else {
                                        var actionFlag = false;
                                    }
                                    scope.charges[i].actionFlag = actionFlag;
                                }

                                scope.chargeTableShow = true;
                            }else {
                                scope.chargeTableShow = false;
                            }
                        }
                    });
                }
            };

            resourceFactory.loanResource.getAllNotes({loanId: routeParams.id,resourceType:'notes'}, function (data) {
                scope.loanNotes = data;
            });

            resourceFactory.glimResource.getAllByLoan({loanId: routeParams.id}, function (data) {
                scope.glimClientsDetails = data;
                scope.isGlim = data.length>0;
            });
            scope.getChargeWaiveLink = function(loanId, chargeId){
                var suffix = "loanaccountcharge/"+loanId+"/waivecharge/"+chargeId
                var link = scope.isGlim?"#/glim"+suffix:"#/"+suffix;
                return link;
            }

            scope.saveNote = function () {
                resourceFactory.loanResource.save({loanId: routeParams.id, resourceType: 'notes'}, this.formData, function (data) {
                    var today = new Date();
                    temp = { id: data.resourceId, note: scope.formData.note, createdByUsername: "test", createdOn: today };
                    scope.loanNotes.push(temp);
                    scope.formData.note = "";
                    scope.predicate = '-id';
                });
            };

            scope.getLoanDocuments = function () {
                resourceFactory.LoanDocumentResource.getLoanDocuments({loanId: routeParams.id}, function (data) {
                    for (var i in data) {
                        var loandocs = {};
                        loandocs = API_VERSION + '/loans/' + data[i].parentEntityId + '/documents/' + data[i].id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                        data[i].docUrl = loandocs;
                    }
                    scope.loandocuments = data;
                });

            };

            scope.routeToRepaymentSchedule = function (glimId, disbursedAmount, clientId, clientName) {
                $rootScope.principalAmount = disbursedAmount;
                scope.disbursementDate = new Date(scope.loandetails.timeline.actualDisbursementDate);
                $rootScope.disbursementDate = dateFilter(scope.disbursementDate, scope.df);
                $rootScope.loanId = scope.loandetails.id;
                $rootScope.clientName = clientName;
                $rootScope.clientId = clientId;
                location.path('/viewglimrepaymentschedule/' + glimId);
            }

            scope.getTotalAmount = function (amount1, amount2, amount3, amount4) {
                amount4 = amount4 == null ? 0 : amount4;
                return (amount1 + amount2 + amount3 + amount4).toFixed(2);
            }

            scope.getTotalOutstandingLoanBalance = function () {
                return scope.glimPrincipalOutstandingAmount + scope.glimInterestOutstandingAmount + scope.glimFeeOutstandingAmount + scope.glimFeepenaltyOutstandingAmount
                + scope.glimFeepenaltyOutstandingAmount.toFixed(2);
            }

            resourceFactory.DataTablesResource.getAllDataTables({apptable: 'm_loan', id: routeParams.id}, function (data) {
                scope.loandatatables = data;
            });

            scope.dataTableChange = function (datatable) {
                resourceFactory.DataTablesResource.getTableDetails({datatablename: datatable.registeredTableName,
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

            scope.export = function () {
                scope.report = true;
                scope.printbtn = false;
                scope.viewReport = false;
                scope.viewLoanReport = true;
                scope.viewTransactionReport = false;
            };

            scope.viewJournalEntries = function(){
                location.path("/searchtransaction/").search({loanId: scope.loandetails.id});
            };

            scope.viewLoanDetails = function () {
                scope.report = false;
                scope.hidePentahoReport = true;
                scope.viewReport = false;
            };

            scope.backToLoanDetails = function () {
                scope.previewRepayment = "";
                scope.report = false;
            }

            scope.viewLoanCollateral = function (collateralId){
                location.path('/loan/'+scope.loandetails.id+'/viewcollateral/'+collateralId).search({status:scope.loandetails.status.value});
            };

            scope.viewDataTable = function (registeredTableName,data){
                if (scope.datatabledetails.isMultirow) {
                    location.path("/viewdatatableentry/"+registeredTableName+"/"+scope.loandetails.id+"/"+data.row[0]);
                }else{
                    location.path("/viewsingledatatableentry/"+registeredTableName+"/"+scope.loandetails.id);
                }
            };

            scope.viewLoanChargeDetails = function (chargeId) {
                location.path('/loan/'+scope.loandetails.id+'/viewcharge/'+chargeId).search({loanstatus:scope.loandetails.status.value});
            };

            scope.viewRepaymentDetails = function() {

                scope.loanApprovedDate = new Date(scope.loandetails.timeline.approvedOnDate);
                scope.loanApprovedDate = dateFilter(scope.loanApprovedDate, scope.df);

                if(scope.report == false){
                    scope.repaymentscheduleinfo = scope.loandetails.originalSchedule;
                    scope.repaymentData = [];
                    scope.disbursedData = [];
                    for(var i in scope.repaymentscheduleinfo.periods) {
                        if(scope.repaymentscheduleinfo.periods[i].period) {
                            scope.repaymentData.push(scope.repaymentscheduleinfo.periods[i]);
                        } else {
                            scope.disbursedData.push(scope.repaymentscheduleinfo.periods[i]);
                        }
                    }
                }
                scope.previewRepayment = true;
                scope.report = true;
            }

            scope.printDiv = function(print) {
                var printContents = document.getElementById(print).innerHTML;
                var popupWin = window.open('', '_blank', 'width=300,height=300');
                popupWin.document.open();
                popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="styles/repaymentscheduleprintstyle.css" />' +
                '</head><body onload="window.print()">' + printContents + '<br></body></html>');
                popupWin.document.close();
            }

            scope.viewprintdetails = function () {
                //scope.printbtn = true;
                scope.report = true;
                scope.viewTransactionReport = false;
                scope.viewReport = true;
                scope.hidePentahoReport = true;
                scope.formData.outputType = 'PDF';
                scope.baseURL = $rootScope.hostUrl + API_VERSION + "/runreports/" + encodeURIComponent("Client Loan Account Schedule");
                scope.baseURL += "?output-type=" + encodeURIComponent(scope.formData.outputType) + "&tenantIdentifier=" + $rootScope.tenantIdentifier+"&locale="+scope.optlang.code;

                var reportParams = "";
                scope.startDate = dateFilter(scope.date.fromDate, 'yyyy-MM-dd');
                scope.endDate = dateFilter(scope.date.toDate, 'yyyy-MM-dd');
                var paramName = "R_startDate";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(scope.startDate)+ "&";
                paramName = "R_endDate";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(scope.endDate)+ "&";
                paramName = "R_selectLoan";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(scope.loandetails.accountNo);
                if (reportParams > "") {
                    scope.baseURL += "&" + reportParams;
                }
                // allow untrusted urls for iframe http://docs.angularjs.org/error/$sce/insecurl
                scope.viewReportDetails = $sce.trustAsResourceUrl(scope.baseURL);

            };

            scope.viewloantransactionreceipts = function (transactionId) {
                //scope.printbtn = true;
                scope.report = true;
                scope.viewTransactionReport = true;
                scope.viewLoanReport = false;
                scope.viewReport = true;
                scope.hidePentahoReport = true;
                scope.formData.outputType = 'PDF';
                scope.baseURL = $rootScope.hostUrl + API_VERSION + "/runreports/" + encodeURIComponent("Loan Transaction Receipt");
                scope.baseURL += "?output-type=" + encodeURIComponent(scope.formData.outputType) + "&tenantIdentifier=" + $rootScope.tenantIdentifier+"&locale="+scope.optlang.code;

                var reportParams = "";
                var paramName = "R_transactionId";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(transactionId);
                if (reportParams > "") {
                    scope.baseURL += "&" + reportParams;
                }
                // allow untrusted urls for iframe http://docs.angularjs.org/error/$sce/insecurl
                scope.viewReportDetails = $sce.trustAsResourceUrl(scope.baseURL);

            };
            scope.viewloantransactionjournalentries = function(transactionId){
                var transactionId = "L" + transactionId;
                if(scope.loandetails.clientId != null && scope.loandetails.clientId != ""){
                    location.path('/viewtransactions/' + transactionId).search({productName: scope.loandetails.loanProductName,loanId:scope.loandetails.id,clientId: scope.loandetails.clientId,
                        accountNo: scope.loandetails.accountNo,clientName: scope.loandetails.clientName});
                }else{
                    location.path('/viewtransactions/' + transactionId).search({productName: scope.loandetails.loanProductName,loanId:scope.loandetails.id,accountNo: scope.loandetails.accountNo,
                        groupId :scope.loandetails.group.id,groupName :scope.loandetails.group.name});

                }

            };

            scope.printReport = function () {
                window.print();
                window.close();
            }

            scope.deleteAll = function (apptableName, entityId) {
                resourceFactory.DataTablesResource.delete({datatablename: apptableName, entityId: entityId, genericResultSet: 'true'}, {}, function (data) {
                    route.reload();
                });
            };

            scope.deleteDocument = function (documentId, index) {
                resourceFactory.LoanDocumentResource.delete({loanId: scope.loandetails.id, documentId: documentId}, '', function (data) {
                    scope.loandocuments.splice(index, 1);
                });
            };

            scope.downloadDocument = function (documentId) {

            };

            scope.transactionSort = {
                column: 'date',
                descending: true
            };
            scope.changeTransactionSort = function(column) {
                var sort = scope.transactionSort;
                if (sort.column == column) {
                    sort.descending = !sort.descending;
                } else {
                    sort.column = column;
                    sort.descending = true;
                }
            };

            scope.showEdit = function(disbursementDetail){
                if((!disbursementDetail.actualDisbursementDate || disbursementDetail.actualDisbursementDate == null)
                    && ((scope.status == 'Submitted and pending approval' && !scope.response.uiDisplayConfigurations.
                        viewLoanAccountDetails.isHiddenFeild.editTranches) || (scope.status =='Approved' && !scope.response.uiDisplayConfigurations.
                        viewLoanAccountDetails.isHiddenFeild.editTranches) || scope.status == 'Active')){
                    return true;
                }
                return false;
            };

            scope.showApprovedAmountBasedOnStatus = function () {
                if (scope.status == 'Submitted and pending approval' || scope.status == 'Withdrawn by applicant' || scope.status == 'Rejected') {
                    return false;
                }
                return true;
            };
            scope.showDisbursedAmountBasedOnStatus = function(){
                if(scope.status == 'Submitted and pending approval' ||scope.status == 'Withdrawn by applicant' || scope.status == 'Rejected' ||
                    scope.status == 'Approved'){
                    return false;
                }
                return true;
            };

            scope.checkStatus = function(){
                if(scope.status == 'Active' || scope.status == 'Closed (obligations met)' || scope.status == 'Overpaid' ||
                    scope.status == 'Closed (rescheduled)' || scope.status == 'Closed (written off)'){
                    return true;
                }
                return false;
            };

            /***
             * we are using orderBy(https://docs.angularjs.org/api/ng/filter/orderBy) filter to sort fields in ui
             * api returns dates in array format[yyyy, mm, dd], converting the array of dates to date object
             * @param dateFieldName
             */
            scope.convertDateArrayToObject = function(dateFieldName){
                for(var i in scope.loandetails.transactions){
                    scope.loandetails.transactions[i][dateFieldName] = new Date(scope.loandetails.transactions[i].date);
                }
            };

            scope.showAddDeleteTrancheButtons = function(action){
                scope.return = true;
                if(scope.status == 'Closed (obligations met)' || scope.status == 'Overpaid' ||
                    scope.status == 'Closed (rescheduled)' || scope.status == 'Closed (written off)' ||
                    scope.status =='Submitted and pending approval'){
                    scope.return = false;
                }
                scope.totalDisbursedAmount = 0;
                scope.count = 0;
                for(var i in scope.loandetails.disbursementDetails){
                    if(scope.loandetails.disbursementDetails[i].actualDisbursementDate != null){
                        scope.totalDisbursedAmount += scope.loandetails.disbursementDetails[i].principal;
                    }
                    else{
                        scope.count +=  1;
                    }
                }
                if(scope.totalDisbursedAmount == scope.loandetails.approvedPrincipal || scope.return == false){
                    return false;
                }
                if(scope.count == 0 && action == 'deletedisbursedetails'){
                    return false;
                }

                return true;
            };
        }
    });
    mifosX.ng.application.controller('ViewLoanDetailsController', ['$scope', '$routeParams', 'ResourceFactory', '$location', '$route', '$http', '$modal', 'dateFilter', 'API_VERSION', '$sce', '$rootScope', mifosX.controllers.ViewLoanDetailsController]).run(function ($log) {
        $log.info("ViewLoanDetailsController initialized");
    });
}(mifosX.controllers || {}));
