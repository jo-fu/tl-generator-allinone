# TimeLineCurator
### A visual timeline authoring tool that extracts temporal information from freeform text
_TimeLineCurator was created as part of a Master's thesis at the University of British Columbia, Canada and University of Munich (LMU), Germany._

Go to [www.timelinecurator.org](www.timelinecurator.org) to see it running.

Here's a **[short video](https://vimeo.com/123246662)** explaining TLC's purpose and functionality. The application is hosted on [The Heroku Platform](https://www.heroku.com/platform). More information, documentation and examples can be found on the [project's page](http://about.timelinecurator.org). 

###Run application locally:
* Download ZIP
* Unpack it
* Open terminal
* `cd` to folder
* run `$ python app.py`
* open in browser (e.g. http://127.0.0.1:5000)

###The project's folder structure:

- **nltk_data**: Natural Language Toolkit for Python, necessary for splitting freeform text into sentences, tokenizing words etc.
- **static**: contains all static front-end files, like JavaScript files, stylesheets, images and example data
- **templates**: the HTML templates to which the flask app refers
- **ternip**: The "Temporal Expression Recognition and Normalisation in Python" library used to find temporal information inside the freeform text ([project on GitHub](https://github.com/cnorthwood/ternip))
- Procfile: declares how to run app dynos on Heroku platform
- app.py: Flask app that contains the Python commands and connects the front-end with the back-end
- requirements.txt: tells Heroku (where the app is hosted) what dependencies we need