#include "http_server.h"
#include <iostream>
#include <sstream>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <thread>

namespace zerocost {

HttpServer::HttpServer(int port) 
    : port_(port), server_socket_(-1), running_(false) {}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::add_route(const std::string& method, const std::string& path, Handler handler) {
    std::string key = method + ":" + path;
    routes_[key] = handler;
}

void HttpServer::run() {
    // Create socket
    server_socket_ = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket_ < 0) {
        std::cerr << "Error creating socket" << std::endl;
        return;
    }
    
    // Allow port reuse
    int opt = 1;
    if (setsockopt(server_socket_, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        std::cerr << "Error setting socket options" << std::endl;
        close(server_socket_);
        return;
    }
    
    // Bind socket
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port_);
    
    if (bind(server_socket_, (struct sockaddr*)&address, sizeof(address)) < 0) {
        std::cerr << "Error binding socket to port " << port_ << std::endl;
        close(server_socket_);
        return;
    }
    
    // Listen
    if (listen(server_socket_, 10) < 0) {
        std::cerr << "Error listening on socket" << std::endl;
        close(server_socket_);
        return;
    }
    
    running_ = true;
    std::cout << "HTTP Server listening on port " << port_ << std::endl;
    
    // Accept connections
    while (running_) {
        struct sockaddr_in client_address;
        socklen_t client_len = sizeof(client_address);
        
        int client_socket = accept(server_socket_, 
                                   (struct sockaddr*)&client_address, 
                                   &client_len);
        
        if (client_socket < 0) {
            if (running_) {
                std::cerr << "Error accepting connection" << std::endl;
            }
            continue;
        }
        
        // Handle client in a separate thread
        std::thread([this, client_socket]() {
            handle_client(client_socket);
        }).detach();
    }
}

void HttpServer::stop() {
    running_ = false;
    if (server_socket_ >= 0) {
        close(server_socket_);
        server_socket_ = -1;
    }
}

void HttpServer::handle_client(int client_socket) {
    char buffer[8192];
    ssize_t bytes_read = read(client_socket, buffer, sizeof(buffer) - 1);
    
    if (bytes_read < 0) {
        close(client_socket);
        return;
    }
    
    buffer[bytes_read] = '\0';
    std::string request(buffer);
    
    std::string method, path, body;
    parse_http_request(request, method, path, body);
    
    std::string key = method + ":" + path;
    std::string response_body;
    std::string response;
    
    auto it = routes_.find(key);
    if (it != routes_.end()) {
        try {
            response_body = it->second(body);
            response = build_http_response(200, "application/json", response_body);
        } catch (const std::exception& e) {
            response_body = "{\"error\": \"" + std::string(e.what()) + "\"}";
            response = build_http_response(500, "application/json", response_body);
        }
    } else {
        response_body = "{\"error\": \"Not Found\"}";
        response = build_http_response(404, "application/json", response_body);
    }
    
    write(client_socket, response.c_str(), response.length());
    close(client_socket);
}

std::string HttpServer::parse_http_request(const std::string& request, 
                                          std::string& method, 
                                          std::string& path,
                                          std::string& body) {
    std::istringstream stream(request);
    std::string line;
    
    // Parse request line
    if (std::getline(stream, line)) {
        std::istringstream line_stream(line);
        line_stream >> method >> path;
    }
    
    // Skip headers
    while (std::getline(stream, line) && line != "\r" && !line.empty()) {
        // Could parse headers here if needed
    }
    
    // Read body
    std::string body_line;
    while (std::getline(stream, body_line)) {
        body += body_line;
    }
    
    return body;
}

std::string HttpServer::build_http_response(int status_code, 
                                           const std::string& content_type,
                                           const std::string& body) {
    std::ostringstream response;
    
    std::string status_text;
    switch (status_code) {
        case 200: status_text = "OK"; break;
        case 400: status_text = "Bad Request"; break;
        case 404: status_text = "Not Found"; break;
        case 500: status_text = "Internal Server Error"; break;
        default: status_text = "Unknown"; break;
    }
    
    response << "HTTP/1.1 " << status_code << " " << status_text << "\r\n";
    response << "Content-Type: " << content_type << "\r\n";
    response << "Content-Length: " << body.length() << "\r\n";
    response << "Access-Control-Allow-Origin: *\r\n";
    response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type\r\n";
    response << "Connection: close\r\n";
    response << "\r\n";
    response << body;
    
    return response.str();
}

} // namespace zerocost


