# BikeFinder
BikeFinder is an Alexa Skill including front and back end

# Installation
git clone https://github.com/pohndorff/BikeFinder.git

cd ~/BikeFinder && npm install && gulp

# Config
If you plan to work with the code, you need to set up the APP_IDs and Google API Key.

You will also need DynamoDB by Amazon to store the user address. Set it up via IAM Console.

# Story
After figuring out the potential of the Amazon Echo and the many ideas I could develop as a SKILL, I decided to implement something that I myself use very often and feels kind of tedious when using the available apps:

Finding the next share bike station that has bikes available.

The guys from citybik.es offer a robust API to get all necessary information for nearby stations but it is lacking a solution to find stations in any network right now.
I had to cut the available networks down to just the San Fransisco Bay Area for prototyping but if the interest is there I'd be happy to grow the project to more networks, like Seattle, London, Berlin, Prague an the rest of the world.

# How to use the SKILL
To start the downloaded skill just say:
"Alexa, ask Bike Finder set location to four two five Lakehouse Ave, San Jose, CA nine five one one oh"
or address you fancy for you. Just keep in mind that you will only see stations in the Bay Area right now.

To find a nearby free bike, say:
"Alexa, ask Bike Finder where is the next bike"
Alexa will tell you the location of the closest station with bikes.
