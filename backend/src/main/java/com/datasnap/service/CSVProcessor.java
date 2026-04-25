package com.datasnap.service;

import com.datasnap.model.ParsedCSVData;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CSVProcessor {

    public ParsedCSVData parse(InputStream inputStream) throws IOException {
        List<String> columnNames = new ArrayList<>();
        List<List<String>> rows = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] header;
            try {
                header = reader.readNext();
            } catch (CsvValidationException e) {
                throw new IOException("Malformed CSV: unable to read header row.");
            }

            if (header == null || header.length < 2) {
                throw new IOException("CSV must have at least two columns.");
            }

            for (String col : header) {
                columnNames.add(col.trim());
            }

            String[] row;
            int rowIndex = 1;
            try {
                while ((row = reader.readNext()) != null) {
                    rowIndex++;
                    if (row.length == 0 || (row.length == 1 && row[0].trim().isEmpty())) {
                        continue;
                    }
                    List<String> rowData = Arrays.stream(row)
                            .map(String::trim)
                            .collect(Collectors.toList());
                    while (rowData.size() < columnNames.size()) {
                        rowData.add("");
                    }
                    rows.add(rowData);
                }
            } catch (CsvValidationException e) {
                throw new IOException("Malformed CSV at row " + rowIndex + ": " + e.getMessage());
            }
        }

        if (rows.isEmpty()) {
            throw new IOException("CSV file contains no data rows.");
        }

        return new ParsedCSVData(columnNames, rows);
    }
}
