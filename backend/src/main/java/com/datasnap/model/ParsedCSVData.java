package com.datasnap.model;

import java.util.List;

public class ParsedCSVData {

    private List<String> columnNames;
    private List<List<String>> rows;

    public ParsedCSVData() {}

    public ParsedCSVData(List<String> columnNames, List<List<String>> rows) {
        this.columnNames = columnNames;
        this.rows = rows;
    }

    public List<String> getColumnNames() { return columnNames; }
    public void setColumnNames(List<String> columnNames) { this.columnNames = columnNames; }

    public List<List<String>> getRows() { return rows; }
    public void setRows(List<List<String>> rows) { this.rows = rows; }
}
