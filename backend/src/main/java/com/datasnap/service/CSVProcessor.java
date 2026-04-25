package com.datasnap.service;

import com.datasnap.model.ChartData;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
public class CSVProcessor {

    public ChartData parse(InputStream inputStream) throws IOException {
        List<String> labels = new ArrayList<>();
        List<Number> values = new ArrayList<>();
        List<String> columnNames = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] header;
            try {
                header = reader.readNext();
            } catch (CsvValidationException e) {
                throw new IOException("Malformed CSV: unable to read header row.");
            }

            if (header == null || header.length < 2) {
                throw new IOException("CSV must have at least two columns: a label column and a numeric value column.");
            }

            columnNames.add(header[0].trim());
            columnNames.add(header[1].trim());

            String[] row;
            int rowIndex = 1;
            try {
                while ((row = reader.readNext()) != null) {
                    rowIndex++;
                    if (row.length < 2) {
                        throw new IOException("Row " + rowIndex + " has fewer than 2 columns.");
                    }

                    String label = row[0].trim();
                    String rawValue = row[1].trim();

                    double numericValue;
                    try {
                        numericValue = Double.parseDouble(rawValue);
                    } catch (NumberFormatException e) {
                        throw new IOException("Row " + rowIndex + ": value '" + rawValue + "' is not a valid number.");
                    }

                    labels.add(label);
                    values.add(numericValue);
                }
            } catch (CsvValidationException e) {
                throw new IOException("Malformed CSV at row " + rowIndex + ": " + e.getMessage());
            }
        }

        if (labels.isEmpty()) {
            throw new IOException("CSV file contains no data rows.");
        }

        return new ChartData(labels, values, columnNames);
    }
}
