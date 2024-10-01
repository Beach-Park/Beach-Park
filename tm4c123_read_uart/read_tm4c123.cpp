#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <termios.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <iomanip>
#include <fstream>

using namespace std;

char Check_Parking_Status();

int uart_fd;

void UART_Init() {
    // Open UART device
    uart_fd = open("/dev/ttyAMA0", O_RDWR | O_NOCTTY);
    if (uart_fd < 0) {
        perror("Failed to open UART device");
        exit(EXIT_FAILURE);
    }

    // Configure UART
    struct termios options;
    tcgetattr(uart_fd, &options);
    options.c_cflag = B115200 | CS8 | CLOCAL | CREAD;
    options.c_iflag = IGNPAR;
    options.c_oflag = 0;
    options.c_lflag = 0;
    tcflush(uart_fd, TCIFLUSH);
    tcsetattr(uart_fd, TCSANOW, &options);
}


void send_uart(char &c) {
    if (write(uart_fd, &c, 1) < 0) {
        perror("Failed to write to UART device");
        exit(EXIT_FAILURE);
    }
}

void recieve_uart(char &c) {
	if(read(uart_fd, &c, 1) < 0){
		perror("Failed to read from UART device");
		exit(EXIT_FAILURE);
	}
}

int main() {
    UART_Init();
    
    fstream myFile;

    //Read data from tm4c123
    while(true){
		int parking_spots[3] = {0, 0, 0};
        char parking_spot_status = '\0'; 
        int value = 0;
        
        for(int i = 0; i<3; i++){
            parking_spot_status = Check_Parking_Status();
            if(parking_spot_status != '\0'){
                value = static_cast<int>(parking_spot_status);
                parking_spots[i] = value;
            }
        }
        myFile.open("/home/edward/Desktop/Senior Project/Data/Spot_One/parking_status.txt", ios::out); // write mode
        for (int j = 0; j<3; j++){
			cout << parking_spots[j] << endl;
			myFile << parking_spots[j] << endl;
			
		}
        myFile.close();
        cout << endl;

    }

    // Close UART device
    close(uart_fd);

    return 0;
}

char Check_Parking_Status(){
	char status_update = '\0'; 
    recieve_uart(status_update);
    
    return status_update;
}
