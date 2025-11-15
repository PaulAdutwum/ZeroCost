#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include <string>
#include <functional>
#include <map>

namespace zerocost {

class HttpServer {
public:
    using Handler = std::function<std::string(const std::string& body)>;
    
    HttpServer(int port);
    ~HttpServer();
    
    void add_route(const std::string& method, const std::string& path, Handler handler);
    void run();
    void stop();
    
private:
    int port_;
    int server_socket_;
    bool running_;
    std::map<std::string, Handler> routes_;
    
    void handle_client(int client_socket);
    std::string parse_http_request(const std::string& request, 
                                   std::string& method, 
                                   std::string& path,
                                   std::string& body);
    std::string build_http_response(int status_code, 
                                   const std::string& content_type,
                                   const std::string& body);
};

} // namespace zerocost

#endif // HTTP_SERVER_H


