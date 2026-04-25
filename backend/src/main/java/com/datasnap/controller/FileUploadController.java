package com.datasnap.controller;

import com.datasnap.model.ChartData;
import com.datasnap.service.CSVProcessor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class FileUploadController {

    private final CSVProcessor csvProcessor;

    public FileUploadController(CSVProcessor csvProcessor) {
        this.csvProcessor = csvProcessor;
    }

    @PostMapping("/upload")
    public ResponseEntity<ChartData> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided or file is empty.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Invalid file type. Only .csv files are accepted.");
        }

        ChartData chartData = csvProcessor.parse(file.getInputStream());
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/sample")
    public ResponseEntity<byte[]> downloadSample() throws IOException {
        ClassPathResource resource = new ClassPathResource("sample.csv");
        byte[] data = resource.getInputStream().readAllBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sample.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }
}
