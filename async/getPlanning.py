# -*- coding: utf-8 -*-

import urllib
from lxml import html


class Planning:
    def __init__():
        pass


def bonjour():
    print "  ____       _ _   ____  _                   _             "
    print " / ___| __ _| (_) |  _ \| | __ _ _ __  _ __ (_)_ __   __ _ "
    print "| |  _ / _` | | | | |_) | |/ _` | '_ \| '_ \| | '_ \ / _` |"
    print "| |_| | (_| | | | |  __/| | (_| | | | | | | | | | | | (_| |"
    print " \____|\__,_|_|_| |_|   |_|\__,_|_| |_|_| |_|_|_| |_|\__, |"
    print "                                                     |___/ "



def getContent(tag, option, html):
    """
    Permet de récupérer le contenu d'une balise à partir d'une str d'html
    Input :
        tag (str): spécifie la balise dont on doit récupérer le contenu
        option (bool): si on cherche une class ou non
        html (str): str à trier
    Output :
        l (list): renvoie une liste qui contient la classe puis le contenu
    """
    i = 0
    write = False
    readClass = option
    elemClass = "" #récupère les options d'une balise
    elem = "" #récupère le contenu de la balise
    l = []

    for char in html:

        #si on est dans la balise spécifiee en argument
        if write == True:
            if char == '>' and readClass == True:
                readClass = False
            elif readClass == True:
                elemClass = elemClass + char
            else:
                elem = elem + char

        #on avance dans la lecture de la balise
        if char == tag[i]:
            i += 1
        else:
            i = 0

        #si la balise est repérée
        if i == len(tag):
            i = 0
            readClass = option
            write = not write
            if elem != "":
                if option:
                    elem = elem[:-(len(tag)+2)]
                    if elem != "":
                        elemClass = getContent("\"", False, elemClass)
                        if elemClass != []:
                            elemClass = elemClass[0]
                        l.append({'class':elemClass, 'contenu':elem})
                else:
                    elem = elem[:-(len(tag))]
                    l.append(elem)
            elem = ""
            elemClass = ""
    return l


def getHtmlByDay(day, html):
    """
    Permet de ne garder que les lignes qui correspondent au jour mis en argument
    Input :
        day (str): jour
        html (list): liste à nettoyer
    Output :
        cleaned (list): renvoie la liste nettoyée des autres jours
    """
    translate = {'lundi':0, 'mardi':1, 'mercredi':2, 'jeudi':3, 'vendredi':4}
    id = translate[day.lower()]
    cleaned = []
    for elem in html:
        if "column"+str(id) in elem['class']:
            cleaned.append(elem)
    return cleaned


def show(html):
    """
    Affichage dans la console du Planning
    Input :
        html (list): list à afficher
    """
    numbers = "0123456798"
    for elem in html:
        if elem['contenu'][0] in numbers:
            print " "
            print "----------"
            print " " + elem['contenu']
            print "----------"
        elif elem['contenu'][:6].upper() == "GR":
            print " "
            print "/" + elem['contenu']
        else:
            print "|" + elem['contenu']



bonjour()

url = "https://planning.galileo-cpe.net/3CGP/index.html"
rawHTML = urllib.urlopen(url).read()
tbody = getContent("tbody", False, rawHTML)
td = getContent("td", True, tbody[0])
td = getHtmlByDay("jeudi",td)
show(td)
