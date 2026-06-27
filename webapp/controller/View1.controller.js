sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Spreadsheet, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("app.kpi.controller.View1", {

        onInit: function () {

            var oModel = new JSONModel();

            oModel.loadData(
                sap.ui.require.toUrl("app/kpi/model/NotificationKPI.json")
            );

            this.getView().setModel(oModel, "kpi");
        },

        onCIDCheck: function (oEvent) {

    var aEDSCIDs = [
        "KCZ","HLR","CBW","MKC","RIQ","AES","CWQ","MFD","DOH","GMH",
        "KIW","KCK","ZOT","CS1","HUY","NAC","MCA","MXL","OGT","NSC",
        "CVQ","FJQ","SCJ","T1S","GLL","ESZ","EP1","PTW","PWS","KME",
        "LGR","BZZ","DHQ","BAS","UNV","ERK","ERB","HMA","VDF","WAR",
        "YLE","FCG","NTV","OCA","HWI","HTI","HZD","GLM","ANO","EQA",
        "HME","HYA","HYE","HMF","HMJ","HMK","HMU","HGL","HGY","HYN",
        "LGN","VCF","VEF","AZZ","EKN","DSM","RCZ","IKQ","UGS","SNJ",
        "BAY","FSN","SCH","VTE","QS1","JYS","HCG","LHG","HGK","FRD",
        "NXQ","NPH","ABB"
    ];

    var oInput = oEvent.getSource();
    var sValue = oInput.getValue().trim().toUpperCase();

    // Convert input to uppercase
    oInput.setValue(sValue);

    // Remove previous bold style
    oInput.removeStyleClass("successInput");

    // Check only when 6 characters are entered
    if (sValue.length === 6) {

        var sCID = sValue.slice(-3);

        if (aEDSCIDs.includes(sCID)) {

            oInput.setValueState("Success");
            oInput.setValueStateText("EDS System Found - CID: " + sCID);

            // Make entered text bold
            oInput.addStyleClass("successInput");

            // Show success message
            MessageToast.show("EDS System Found - CID: " + sCID);

        } else {

            oInput.setValueState("None");
            oInput.setValueStateText("");
            oInput.removeStyleClass("successInput");
        }

    } else {

        oInput.setValueState("None");
        oInput.setValueStateText("");
        oInput.removeStyleClass("successInput");
    }
},

        onCalculateTimeDiff: function (oEvent) {

            var oModel = this.getView().getModel("kpi");
            var oContext = oEvent.getSource().getBindingContext("kpi");

            if (!oContext) {
                return;
            }

            var sPath = oContext.getPath();

            var sStart = oModel.getProperty(sPath + "/EventOutageStartTime");
            var sEnd = oModel.getProperty(sPath + "/EventTriggerTime");

            if (!sStart || !sEnd) {
                return;
            }

            function parseDateTime(sDateTime) {

                var aParts = sDateTime.trim().split(" ");

                if (aParts.length !== 2) {
                    return null;
                }

                var aDate = aParts[0].split("/");
                var aTime = aParts[1].split(":");

                if (aDate.length !== 3 || aTime.length !== 3) {
                    return null;
                }

                return new Date(
                    parseInt(aDate[2], 10),
                    parseInt(aDate[0], 10) - 1,
                    parseInt(aDate[1], 10),
                    parseInt(aTime[0], 10),
                    parseInt(aTime[1], 10),
                    parseInt(aTime[2], 10)
                );
            }

            var dStart = parseDateTime(sStart);
            var dEnd = parseDateTime(sEnd);

            if (!dStart || !dEnd ||
                isNaN(dStart.getTime()) ||
                isNaN(dEnd.getTime())) {

                oModel.setProperty(sPath + "/TimeDiff", "Invalid Format");
                return;
            }

            var iDiff = Math.abs(dEnd.getTime() - dStart.getTime());

            var iHours = Math.floor(iDiff / (1000 * 60 * 60));
            var iMinutes = Math.floor((iDiff % (1000 * 60 * 60)) / (1000 * 60));
            var iSeconds = Math.floor((iDiff % (1000 * 60)) / 1000);

            var sDiff =
                String(iHours).padStart(2, "0") + ":" +
                String(iMinutes).padStart(2, "0") + ":" +
                String(iSeconds).padStart(2, "0");

            oModel.setProperty(sPath + "/TimeDiff", sDiff);
        },
        

        onExportExcel: function () {

            var oModel = this.getView().getModel("kpi");
            var aData = oModel.getProperty("/NotificationKPIData");

            var aColumns = [
                { label: "Sl.No", property: "SlNo" },
                { label: "Install Base Item", property: "InstallBaseItem" },
                { label: "Alert Based Incident/Case", property: "AlertBasedIncidentCase" },
                { label: "Alert Category", property: "AlertCategory" },
                { label: "Business Type", property: "BusinessType" },
                { label: "Disruption/Degradation", property: "DisruptionDegradation" },
                { label: "Event ID", property: "EventID" },
                { label: "Event/Outage Start Time", property: "EventOutageStartTime" },
                { label: "Event Trigger Time", property: "EventTriggerTime" },
                { label: "Time Diff", property: "TimeDiff" },
                { label: "Remarks", property: "Remarks" }
            ];

            var oSettings = {
                workbook: {
                    columns: aColumns
                },
                dataSource: aData,
                fileName: "Notification_KPI.xlsx"
            };

            var oSpreadsheet = new Spreadsheet(oSettings);

            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
            });
        }
    });
});