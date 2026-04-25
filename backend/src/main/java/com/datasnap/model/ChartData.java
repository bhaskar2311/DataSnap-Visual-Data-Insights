package com.datasnap.model;

import java.util.List;

public class ChartData {

    private List<String> labels;
    private List<Number> values;
    private List<String> columnNames;

    public ChartData() {}

    public ChartData(List<String> labels, List<Number> values, List<String> columnNames) {
        this.labels = labels;
        this.values = values;
        this.columnNames = columnNames;
    }

    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }

    public List<Number> getValues() { return values; }
    public void setValues(List<Number> values) { this.values = values; }

    public List<String> getColumnNames() { return columnNames; }
    public void setColumnNames(List<String> columnNames) { this.columnNames = columnNames; }
}
