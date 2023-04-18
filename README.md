# pkt_viewer

This project aims to develop a visualization tool that is useful to identify network congestion.

# Live Demo

For the demonstration purpose, the visualization system is avaliable online in the following URL. 

https://uregina.ca/~mty754/pktviz/ 


[NOTE]: Please use Google Chrome to load the URL. Some javascript instructions used in this system are not supported by Firefox. 

# Tested Browser

- Works perfectly on Google Chrome Version 112.0.5615.49 (Official Build) (64-bit) 
- Throws syntax error on Firefox Version 112.0.1 (64-bit) because "import assertions" are not currently supported by firefox. 

# How to run the code locally

- Download and install Visual Studio Code (VS Code) from the following URL.
	https://code.visualstudio.com/download
	
- Once VS Code is installed, install "Live Server" extension from the extension tab of VS Code. If it is installed successfully, you should see a "Go Live" section in the bottom panel of VS Code. For more information on how to install and use "Live Server", please visit the following link:
	https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

- Add the source code folder to the workspace of VS Code.

- Click on the "Go Live" section to launch a local server and the visualization system will be loaded to your default browser. If the default browser is not Google Chrome, then the software may not work properly. In that case, close the browser and open the following link in Google Chrome. 

	http://127.0.0.1:5500/ (5500 is the default port used by "Live Server" in VS code)

- Make sure there are no other folder added to the workspace. In that case, you need to select the folder which you want to loade in "Live Server". 

- To close the "Live Server", simply close the "VS Code". 
