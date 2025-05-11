#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import datetime
import os
import sys
import argparse
from collections import defaultdict
import time
import math
import shutil
import re

# Couleurs ANSI pour le terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    
    @staticmethod
    def disable():
        Colors.HEADER = ''
        Colors.BLUE = ''
        Colors.CYAN = ''
        Colors.GREEN = ''
        Colors.YELLOW = ''
        Colors.RED = ''
        Colors.ENDC = ''
        Colors.BOLD = ''
        Colors.UNDERLINE = ''

# ASCII Art banner
BANNER = """
░██████╗░██╗████████╗░░░░░░██╗███╗░░██╗███████╗░█████╗░░██████╗
██╔════╝░██║╚══██╔══╝░░░░░░██║████╗░██║██╔════╝██╔══██╗██╔════╝
██║░░██╗░██║░░░██║░░░█████╗██║██╔██╗██║█████╗░░██║░░██║╚█████╗░
██║░░╚██╗██║░░░██║░░░╚════╝██║██║╚████║██╔══╝░░██║░░██║░╚═══██╗
╚██████╔╝██║░░░██║░░░░░░░░░██║██║░╚███║██║░░░░░╚█████╔╝██████╔╝
░╚═════╝░╚═╝░░░╚═╝░░░░░░░░░╚═╝╚═╝░░╚══╝╚═╝░░░░░░╚════╝░╚═════╝░
"""

VERSION = "1.2.0"

# Obtenir la largeur du terminal
try:
    terminal_width = shutil.get_terminal_size().columns
except:
    terminal_width = 80

def print_banner(fast_mode=False):
    """Affiche le banner ASCII art avec animation."""
    delay = 0.02 if not fast_mode else 0
    for line in BANNER.split('\n'):
        print(f"{Colors.CYAN}{line}{Colors.ENDC}")
        time.sleep(delay)
    print(f"{Colors.YELLOW}v{VERSION} - Analyseur de temps de travail pour projets Git{Colors.ENDC}")
    print()

def print_header(text):
    """Affiche un titre de section avec design."""
    width = min(terminal_width - 2, 80)
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'═'*width}{Colors.ENDC}")
    text_width = len(re.sub(r'\033\[[0-9;]+m', '', text))
    padding = (width - text_width) // 2
    print(f"{Colors.BOLD}{Colors.BLUE}{'═'*padding} {text} {'═'*(width - padding - text_width - 2)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'═'*width}{Colors.ENDC}")

def print_subheader(text):
    """Affiche un sous-titre de section avec design."""
    width = min(terminal_width - 2, 80)
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'─'*width}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'─'*width}{Colors.ENDC}")

def print_step(text, icon="🔍"):
    """Affiche une étape avec une icône."""
    print(f"{Colors.YELLOW}{icon}{Colors.ENDC} {Colors.BOLD}{text}{Colors.ENDC}")

def print_info(text, indent=0):
    """Affiche une information générale."""
    indent_str = " " * indent
    print(f"{indent_str}{Colors.CYAN}ℹ {text}{Colors.ENDC}")

def print_success(text, indent=0):
    """Affiche un message de succès."""
    indent_str = " " * indent
    print(f"{indent_str}{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_warning(text, indent=0):
    """Affiche un avertissement."""
    indent_str = " " * indent
    print(f"{indent_str}{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def print_error(text, indent=0):
    """Affiche un message d'erreur."""
    indent_str = " " * indent
    print(f"{indent_str}{Colors.RED}✗ {text}{Colors.ENDC}")

def print_value(label, value, unit="", indent=0, highlight=False):
    """Affiche une paire label/valeur avec formatage."""
    indent_str = " " * indent
    color = Colors.BOLD + Colors.GREEN if highlight else Colors.CYAN
    print(f"{indent_str}{label}: {color}{value}{Colors.ENDC}{' ' + unit if unit else ''}")

def print_progress_bar(iteration, total, prefix='', suffix='', length=40, fill='█'):
    """Affiche une barre de progression animée."""
    if total == 0:
        return
    
    percent = "{0:.1f}".format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + ' ' * (length - filled_length)
    
    if iteration == total:
        print(f'\r{Colors.GREEN}{prefix} |{bar}| {percent}% {suffix}{Colors.ENDC}', end='\n')
    else:
        print(f'\r{Colors.YELLOW}{prefix} |{bar}| {percent}% {suffix}{Colors.ENDC}', end='')
    sys.stdout.flush()

def format_time_period(seconds):
    """Formate une période de temps en format lisible."""
    if seconds < 60:
        return f"{seconds:.0f} secondes"
    elif seconds < 3600:
        return f"{seconds/60:.1f} minutes"
    elif seconds < 86400:
        hours = seconds / 3600
        return f"{hours:.1f} heures"
    else:
        days = seconds / 86400
        return f"{days:.1f} jours"

def format_date(dt):
    """Formate une date de manière lisible."""
    now = datetime.datetime.now()
    diff = now - dt
    
    if diff.days == 0:
        if diff.seconds < 3600:
            return f"il y a {diff.seconds // 60} minutes"
        else:
            return f"aujourd'hui à {dt.strftime('%H:%M')}"
    elif diff.days == 1:
        return f"hier à {dt.strftime('%H:%M')}"
    elif diff.days < 7:
        return f"il y a {diff.days} jours"
    else:
        return dt.strftime('%d %b %Y')
def run_git_command(repo_path, command, verbose=False):
    """Exécute une commande git et retourne le résultat."""
    try:
        full_command = ['git', '-C', repo_path] + command
        if verbose:
            print_info(f"Exécution: {' '.join(full_command)}", indent=2)
            sys.stdout.flush()
        
        result = subprocess.run(full_command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print_error(f"Erreur Git: {e.stderr}", indent=2)
        return None
    except Exception as e:
        print_error(f"Erreur: {str(e)}", indent=2)
        return None

def is_git_repo(path, verbose=False):
    """Vérifie si le chemin est un dépôt Git valide."""
    if verbose:
        print_step("Vérification du dépôt Git", "🔎")
        print_info(f"Chemin: {path}", indent=2)
    
    is_valid = os.path.exists(os.path.join(path, '.git'))
    
    if verbose:
        if is_valid:
            print_success(f"Dépôt Git valide trouvé", indent=2)
        else:
            print_error(f"Pas un dépôt Git valide", indent=2)
    
    return is_valid

def get_repo_info(repo_path, verbose=False):
    """Récupère des informations de base sur le dépôt."""
    if verbose:
        print_step("Récupération des informations du dépôt", "📊")
    
    info = {}
    
    # Nom du dépôt
    try:
        remote_url = run_git_command(repo_path, ['config', '--get', 'remote.origin.url'], False)
        if remote_url:
            repo_name = os.path.basename(remote_url)
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            info['name'] = repo_name
        else:
            info['name'] = os.path.basename(os.path.abspath(repo_path))
    except:
        info['name'] = os.path.basename(os.path.abspath(repo_path))
    
    # Branche actuelle
    try:
        info['branch'] = run_git_command(repo_path, ['rev-parse', '--abbrev-ref', 'HEAD'], False)
    except:
        info['branch'] = "inconnu"
    
    # Dernier commit
    try:
        last_commit_hash = run_git_command(repo_path, ['rev-parse', 'HEAD'], False)
        last_commit_date = run_git_command(repo_path, ['log', '-1', '--format=%cd', '--date=iso'], False)
        info['last_commit'] = {
            'hash': last_commit_hash[:8] if last_commit_hash else "inconnu",
            'date': last_commit_date if last_commit_date else "inconnu"
        }
    except:
        info['last_commit'] = {'hash': "inconnu", 'date': "inconnu"}
    
    if verbose:
        print_info(f"Nom du dépôt: {info['name']}", indent=2)
        print_info(f"Branche actuelle: {info['branch']}", indent=2)
        print_info(f"Dernier commit: {info['last_commit']['hash']} ({info['last_commit']['date']})", indent=2)
    
    return info

def get_commits(repo_path, author=None, since=None, until=None, branch=None, verbose=False):
    """Récupère la liste des commits avec leurs timestamps."""
    if verbose:
        print_step("Récupération des commits", "🔄")
        filters = []
        if author:
            filters.append(f"auteur: {author}")
        if since:
            filters.append(f"depuis: {since}")
        if until:
            filters.append(f"jusqu'à: {until}")
        if branch:
            filters.append(f"branche: {branch}")
        
        if filters:
            print_info(f"Filtres: {', '.join(filters)}", indent=2)
    
    cmd = ['log', '--pretty=format:%H|%an|%ae|%at|%s|%ad', '--date=iso']
    
    if author:
        cmd.extend(['--author', author])
    if since:
        cmd.extend(['--since', since])
    if until:
        cmd.extend(['--until', until])
    if branch:
        cmd.append(branch)
        
    output = run_git_command(repo_path, cmd, verbose)
    if not output:
        if verbose:
            print_warning("Aucun commit trouvé correspondant aux critères.", indent=2)
        return []
        
    lines = output.split('\n')
    total_commits = len(lines)
    
    if verbose:
        print_info(f"Traitement de {total_commits} commits...", indent=2)
        
    commits = []
    for i, line in enumerate(lines):
        if not line.strip():
            continue
            
        try:
            parts = line.split('|', 5)
            if len(parts) == 6:
                commit_hash, author_name, author_email, timestamp, message, date_iso = parts
                
                # Conversion du timestamp en datetime
                commit_time = datetime.datetime.fromtimestamp(int(timestamp))
                
                commits.append({
                    'hash': commit_hash,
                    'author_name': author_name,
                    'author_email': author_email,
                    'timestamp': int(timestamp),
                    'datetime': commit_time,
                    'message': message,
                    'date_iso': date_iso
                })
                
                if verbose and total_commits > 200 and i % (total_commits // 10) == 0:
                    print_progress_bar(i+1, total_commits, 
                                    prefix='  Progression:', 
                                    suffix=f'({i+1}/{total_commits})', 
                                    length=30)
                    
        except Exception as e:
            print_error(f"Erreur lors du traitement du commit: {line}", indent=2)
            continue
                
    # Trier par ordre chronologique
    commits.sort(key=lambda x: x['timestamp'])
    
    if verbose and total_commits > 200:
        print_progress_bar(total_commits, total_commits, 
                         prefix='  Progression:', 
                         suffix=f'({total_commits}/{total_commits})', 
                         length=30)
    
    if verbose:
        print_success(f"{len(commits)} commits trouvés et triés chronologiquement.", indent=2)
        if commits:
            print_info(f"Premier commit: {format_date(commits[0]['datetime'])}", indent=4)
            print_info(f"Dernier commit: {format_date(commits[-1]['datetime'])}", indent=4)
    return commits
def calculate_work_sessions(commits, session_threshold=3, verbose=False):
    """Groupe les commits en sessions de travail basées sur la proximité temporelle."""
    if not commits:
        return []
    
    if verbose:
        print_step(f"Regroupement en sessions de travail", "📋")
        print_info(f"Seuil entre sessions: {session_threshold} heures", indent=2)
        
    sessions = []
    current_session = [commits[0]]
    
    if verbose and len(commits) > 500:
        print_info(f"Analyse des écarts temporels entre {len(commits)} commits...", indent=2)
    
    for i in range(1, len(commits)):
        current_commit = commits[i]
        last_commit = current_session[-1]
        
        time_diff = current_commit['datetime'] - last_commit['datetime']
        hours_diff = time_diff.total_seconds() / 3600
        
        # Si le commit est à moins de X heures du dernier, ajouter à la session actuelle
        if hours_diff <= session_threshold:
            current_session.append(current_commit)
        else:
            # Sinon, terminer la session actuelle et en commencer une nouvelle
            sessions.append(current_session)
            if verbose and len(commits) > 500 and len(sessions) % (max(1, len(commits) // 500)) == 0:
                print_progress_bar(i, len(commits), 
                                prefix='  Progression:', 
                                suffix=f'({len(sessions)} sessions)', 
                                length=30)
            current_session = [current_commit]
            
    # Ajouter la dernière session
    if current_session:
        sessions.append(current_session)
    
    if verbose and len(commits) > 500:
        print_progress_bar(len(commits), len(commits), 
                         prefix='  Progression:', 
                         suffix=f'({len(sessions)} sessions)', 
                         length=30)
    
    if verbose:
        print_success(f"{len(sessions)} sessions de travail identifiées.", indent=2)
        
        if sessions:
            print_info("Exemples de sessions:", indent=2)
            for i, session in enumerate(sessions[:min(3, len(sessions))]):
                start = session[0]['datetime']
                end = session[-1]['datetime']
                duration = end - start
                duration_text = format_time_period(duration.total_seconds())
                msg = session[0]['message'][:40] + ('...' if len(session[0]['message']) > 40 else '')
                print_info(f"Session #{i+1}: {start.strftime('%Y-%m-%d %H:%M')} - {duration_text} - {len(session)} commits - \"{msg}\"", indent=4)
            
            if len(sessions) > 3:
                print_info(f"... et {len(sessions)-3} autres sessions", indent=4)
            
    return sessions

def estimate_work_time(sessions, verbose=False):
    """Estime le temps de travail total à partir des sessions."""
    if not sessions:
        return {
            'total_hours': 0,
            'sessions_count': 0,
            'session_details': []
        }
    
    if verbose:
        print_step("Estimation du temps de travail", "⏱️")
        
    total_hours = 0
    total_raw_hours = 0
    session_details = []
    
    for i, session in enumerate(sessions):
        start_time = session[0]['datetime']
        end_time = session[-1]['datetime']
        
        # Durée de la session
        duration = end_time - start_time
        hours = duration.total_seconds() / 3600
        total_raw_hours += hours
        
        # Limiter à une durée raisonnable de travail continu
        adjusted_hours = min(hours, 8) if hours > 0 else 0.5
        
        # Ajouter un minimum de temps par session
        if adjusted_hours < 0.5 and len(session) > 0:
            adjusted_hours = 0.5
            
        # Ajuster en fonction du nombre de commits dans la session
        commit_factor = min(1 + (len(session) - 1) * 0.1, 2)
        final_hours = adjusted_hours * commit_factor
        
        total_hours += final_hours
        
        session_details.append({
            'start': start_time,
            'end': end_time,
            'commits': len(session),
            'raw_hours': hours,
            'estimated_hours': final_hours
        })
        
        if verbose and (i < 3 or (len(sessions) > 10 and i % (len(sessions) // 5) == 0)):
            duration_str = f"{hours:.1f}h → {final_hours:.1f}h"
            print_info(f"{start_time.strftime('%Y-%m-%d %H:%M')}: {len(session)} commits, {duration_str}", indent=2)
    
    if verbose:
        print_success(f"Temps total estimé: {total_hours:.2f} heures", indent=2)
        if len(sessions) > 0:
            print_info(f"Moyenne par session: {total_hours/len(sessions):.2f} heures", indent=4)
            print_info(f"Facteur d'ajustement global: {total_hours/max(0.1, total_raw_hours):.2f}x", indent=4)
    
    return {
        'total_hours': total_hours,
        'total_raw_hours': total_raw_hours,
        'sessions_count': len(sessions),
        'session_details': session_details
    }

def generate_chart(data, max_value, title, width=40, show_percentage=True):
    """Génère un graphique simple en ASCII art."""
    print(f"\n  {Colors.BOLD}{title}{Colors.ENDC}")
    print(f"  {Colors.BLUE}{'─' * (width + 12)}{Colors.ENDC}")
    
    # Calculer le total pour les pourcentages
    total = sum(v for _, v in data) if show_percentage else 0
    
    # Trouver la longueur maximale des labels pour l'alignement
    max_label_len = max(len(label) for label, _ in data) if data else 0
    
    for label, value in data:
        bar_length = int((value / max_value) * width) if max_value > 0 else 0
        percentage = (value / total) * 100 if total > 0 else 0
        bar = '█' * bar_length
        
        # Formater avec alignement
        if show_percentage:
            print(f"  {Colors.CYAN}{label.ljust(max_label_len)}{Colors.ENDC} │ {Colors.GREEN}{bar}{Colors.ENDC} {Colors.YELLOW}{value}{Colors.ENDC} ({percentage:.1f}%)")
        else:
            print(f"  {Colors.CYAN}{label.ljust(max_label_len)}{Colors.ENDC} │ {Colors.GREEN}{bar}{Colors.ENDC} {Colors.YELLOW}{value}{Colors.ENDC}")
    
    print(f"  {Colors.BLUE}{'─' * (width + 12)}{Colors.ENDC}")
def generate_calendar_heatmap(commits, year=None, month=None):
    """Génère un calendrier heatmap des commits."""
    if not commits:
        return
    
    # Filtrer par année et mois si spécifiés
    if year is None:
        # Utiliser l'année du dernier commit par défaut
        year = commits[-1]['datetime'].year
    
    filtered_commits = [c for c in commits if c['datetime'].year == year]
    if month is not None:
        filtered_commits = [c for c in filtered_commits if c['datetime'].month == month]
    
    if not filtered_commits:
        print_warning(f"Aucun commit pour la période sélectionnée (année: {year}, mois: {month})")
        return
    
    # Compter les commits par jour
    days_count = defaultdict(int)
    for commit in filtered_commits:
        date_key = commit['datetime'].strftime('%Y-%m-%d')
        days_count[date_key] += 1
    
    # Déterminer l'intensité maximale pour normaliser
    max_count = max(days_count.values()) if days_count else 0
    
    # Générer le titre
    if month:
        month_name = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
                      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][month]
        title = f"Calendrier des commits - {month_name} {year}"
    else:
        title = f"Calendrier des commits - {year}"
    
    print(f"\n  {Colors.BOLD}{title}{Colors.ENDC}")
    print(f"  {Colors.BLUE}{'─' * 50}{Colors.ENDC}")
    
    # Déterminer la plage de dates à afficher
    if month:
        start_date = datetime.date(year, month, 1)
        if month == 12:
            end_date = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end_date = datetime.date(year, month + 1, 1) - datetime.timedelta(days=1)
    else:
        start_date = datetime.date(year, 1, 1)
        end_date = datetime.date(year, 12, 31)
    
    # Générer l'entête des jours de la semaine
    days = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
    print(f"       {'  '.join(days)}")
    
    # Initialiser la date actuelle
    current_date = start_date
    
    # Ajuster pour commencer au début de la semaine
    while current_date.weekday() != 0:  # 0 est lundi
        current_date -= datetime.timedelta(days=1)
    
    # Générer le calendrier
    while current_date <= end_date or current_date.weekday() != 6:  # Jusqu'à la fin de la semaine
        if current_date.weekday() == 0:
            if month:
                print(f"  {current_date.strftime('%d')}  ", end="")
            else:
                print(f"  {current_date.strftime('%b')}  ", end="")
        
        date_key = current_date.strftime('%Y-%m-%d')
        count = days_count.get(date_key, 0)
        
        if count == 0:
            if current_date.month == (month or start_date.month):
                print(f"{Colors.BLUE}·· {Colors.ENDC}", end="")
            else:
                print("   ", end="")
        else:
            # Normaliser l'intensité
            intensity = min(int((count / max_count) * 4), 4)
            char = ["▁", "▃", "▅", "▇", "█"][intensity]
            
            # Couleur basée sur l'intensité
            if intensity <= 1:
                color = Colors.GREEN
            elif intensity <= 2:
                color = Colors.YELLOW
            else:
                color = Colors.RED
            
            print(f"{color}{char}{count} {Colors.ENDC}", end="")
        
        if current_date.weekday() == 6:  # Dimanche, fin de ligne
            print()
        
        current_date += datetime.timedelta(days=1)
    
    print(f"  {Colors.BLUE}{'─' * 50}{Colors.ENDC}")
    
    # Légende
    print(f"  Légende: {Colors.GREEN}▁{Colors.ENDC} Faible, {Colors.YELLOW}▅{Colors.ENDC} Moyen, {Colors.RED}█{Colors.ENDC} Élevé")

def print_report(repo_path, repo_info, commits, sessions, time_estimate, author=None, since=None, until=None, branch=None, verbose=False, detailed=False):
    """Affiche un rapport détaillé des statistiques."""
    if not commits:
        print_warning("Aucun commit trouvé correspondant aux critères.")
        return
    
    if verbose:
        print_step("Génération du rapport final", "📋")
        
    print_header(f"RAPPORT D'ANALYSE - {repo_info['name'].upper()}")
    
    print(f"\n{Colors.BOLD}Informations du projet{Colors.ENDC}")
    print_value("Répertoire", repo_path, indent=2)
    print_value("Dépôt", repo_info['name'], indent=2)
    print_value("Branche", repo_info['branch'], indent=2)
    
    if author:
        print_value("Auteur", author, indent=2)
    if since or until:
        date_range = []
        if since:
            date_range.append(f"depuis {since}")
        if until:
            date_range.append(f"jusqu'à {until}")
        print_value("Période", ", ".join(date_range), indent=2)
        
    # Statistiques générales
    first_commit = commits[0]['datetime']
    last_commit = commits[-1]['datetime']
    project_duration = last_commit - first_commit
    project_days = max(1, project_duration.days)
    
    # Compter les auteurs
    authors = {}
    for commit in commits:
        author_name = commit['author_name']
        if author_name not in authors:
            authors[author_name] = 0
        authors[author_name] += 1
    
    print_subheader("STATISTIQUES GÉNÉRALES")
    
    print_value("Total des commits", len(commits), indent=2, highlight=True)
    print_value("Premier commit", first_commit.strftime('%Y-%m-%d %H:%M:%S'), indent=2)
    print_value("Dernier commit", last_commit.strftime('%Y-%m-%d %H:%M:%S'), indent=2)
    
    months = project_duration.days // 30
    days = project_duration.days % 30
    if months > 0:
        duration_text = f"{months} mois, {days} jours"
    else:
        duration_text = f"{project_days} jours"
    print_value("Durée du projet", duration_text, indent=2)
    print_value("Moyenne de commits par jour", f"{len(commits) / project_days:.2f}", indent=2)
    
    # Principales statistiques horaires
    print_value("Commits par semaine", f"{len(commits) / (project_days/7):.1f}", indent=2)
    print_value("Commits par mois", f"{len(commits) / max(1, months):.1f}", indent=2)
    
    # Contributeurs
    if len(authors) > 1:
        print(f"\n{Colors.BOLD}Contributeurs{Colors.ENDC}")
        sorted_authors = sorted(authors.items(), key=lambda x: x[1], reverse=True)
        
        # Génération du graphique des contributeurs
        if len(sorted_authors) > 0:
            max_commits = sorted_authors[0][1]
            top_authors = sorted_authors[:min(8, len(sorted_authors))]
            generate_chart(top_authors, max_commits, "Contributions par auteur")
            if len(sorted_authors) > 8:
                print_info(f"... et {len(sorted_authors)-8} autres contributeurs", indent=2)
    
    # Estimation du temps
    print_subheader("ESTIMATION DU TEMPS DE TRAVAIL")
    
    print_value("Temps total estimé", f"{time_estimate['total_hours']:.2f}", "heures", indent=2, highlight=True)
    print_value("Équivalent en jours de travail (8h)", f"{time_estimate['total_hours']/8:.2f}", "jours", indent=2)
    print_value("Nombre de sessions de travail", time_estimate['sessions_count'], indent=2)
    
    if time_estimate['sessions_count'] > 0:
        avg_session_duration = time_estimate['total_hours'] / time_estimate['sessions_count']
        print_value("Durée moyenne par session", f"{avg_session_duration:.2f}", "heures", indent=2)
        print_value("Temps moyen par commit", f"{time_estimate['total_hours']/len(commits):.2f}", "heures", indent=2)
        
        # Facteur d'ajustement
        adjustment_factor = time_estimate['total_hours'] / time_estimate['total_raw_hours'] if time_estimate['total_raw_hours'] > 0 else 1
        print_value("Facteur d'ajustement appliqué", f"{adjustment_factor:.2f}x", indent=2)
        
        # Top 5 des sessions les plus longues
        if detailed or verbose:
            print(f"\n{Colors.BOLD}Top 5 des sessions les plus longues{Colors.ENDC}")
            sorted_sessions = sorted(time_estimate['session_details'], 
                                    key=lambda x: x['estimated_hours'], 
                                    reverse=True)
            for i, session in enumerate(sorted_sessions[:5]):
                start_date = session['start'].strftime('%Y-%m-%d')
                start_time = session['start'].strftime('%H:%M')
                hours = session['estimated_hours']
                commits_count = session['commits']
                
                commit_msg = session['start'].strftime('%Y-%m-%d %H:%M')
                print_info(f"{i+1}. {start_date} à {start_time} - {hours:.2f}h ({commits_count} commits) - \"{commit_msg}\"", indent=2)
    
    # Distribution des sessions par jour de la semaine
    if time_estimate['sessions_count'] > 0:
        days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
        day_dist = defaultdict(int)
        hour_dist = defaultdict(int)
        day_hours = defaultdict(float)
        
        for session in time_estimate['session_details']:
            day = session['start'].weekday()
            hour = session['start'].hour
            day_dist[day] += 1
            hour_dist[hour] += 1
            day_hours[day] += session['estimated_hours']
            
        # Génération du graphique des jours (nombre de sessions)
        day_data = [(days[day_idx], count) for day_idx, count in sorted(day_dist.items())]
        if day_data:
            max_count = max(count for _, count in day_data)
            generate_chart(day_data, max_count, "Sessions par jour de la semaine")
        
        # Génération du graphique des jours (heures de travail)
        if detailed or verbose:
            day_hours_data = [(days[day_idx], hours) for day_idx, hours in sorted(day_hours.items())]
            if day_hours_data:
                max_hours = max(hours for _, hours in day_hours_data)
                generate_chart(day_hours_data, max_hours, "Heures de travail par jour de la semaine")
        
        # Distribution par heure de la journée
        if detailed or verbose:
            print(f"\n{Colors.BOLD}Distribution par heure de la journée{Colors.ENDC}")
            hour_data = [(f"{hour}h", count) for hour, count in sorted(hour_dist.items())]
            if hour_data:
                max_count = max(count for _, count in hour_data)
                generate_chart(hour_data, max_count, "Sessions par heure")
    
    # Répartition mensuelle des commits
    print(f"\n{Colors.BOLD}Répartition mensuelle des commits{Colors.ENDC}")
    # Grouper les commits par mois
    months = defaultdict(int)
    month_hours = defaultdict(float)
    
    for commit in commits:
        month_key = commit['datetime'].strftime('%Y-%m')
        months[month_key] += 1
    
    for session in time_estimate['session_details']:
        month_key = session['start'].strftime('%Y-%m')
        month_hours[month_key] += session['estimated_hours']
    
    # Afficher les derniers mois (tous ou les 12 derniers)
    sorted_months = sorted(months.items())
    display_months = sorted_months[-min(12, len(sorted_months)):]
    
    # Génération du graphique des commits par mois
    if display_months:
        max_count = max(count for _, count in display_months)
        generate_chart(display_months, max_count, "Commits par mois")
    
    # Génération du graphique des heures par mois
    if detailed or verbose:
        month_hours_data = [(month, month_hours.get(month, 0)) for month, _ in display_months]
        if month_hours_data and any(hours > 0 for _, hours in month_hours_data):
            max_hours = max(hours for _, hours in month_hours_data)
            generate_chart(month_hours_data, max_hours, "Heures de travail par mois")
    
    # Calendrier heatmap pour l'année en cours ou la dernière année
    if detailed or verbose:
        current_year = datetime.datetime.now().year
        # Si la majorité des commits sont de l'année en cours, montrer cette année
        commits_in_current_year = sum(1 for c in commits if c['datetime'].year == current_year)
        if commits_in_current_year > len(commits) / 2:
            generate_calendar_heatmap(commits, year=current_year)
        else:
            # Sinon, montrer l'année avec le plus de commits
            years_count = defaultdict(int)
            for commit in commits:
                years_count[commit['datetime'].year] += 1
            
            if years_count:
                most_active_year = max(years_count.items(), key=lambda x: x[1])[0]
                generate_calendar_heatmap(commits, year=most_active_year)
            # Activité par taille de commits
    if detailed or verbose:
        print_subheader("ANALYSE DE L'ACTIVITÉ")
        
        # Récupérer les statistiques de chaque commit
        commit_stats = []
        for commit in commits:
            try:
                # Récupérer les stats de ce commit (fichiers modifiés, insertions, suppressions)
                stat_cmd = ['show', '--stat', '--format=format:', commit['hash']]
                stat_output = run_git_command(repo_path, stat_cmd, False)
                
                if stat_output:
                    # Analyser les statistiques
                    changes = 0
                    files_changed = 0
                    
                    # Chercher le résumé à la fin
                    summary_match = re.search(r'(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?', stat_output)
                    if summary_match:
                        files_changed = int(summary_match.group(1) or 0)
                        insertions = int(summary_match.group(2) or 0)
                        deletions = int(summary_match.group(3) or 0)
                        changes = insertions + deletions
                    
                    commit_stats.append({
                        'hash': commit['hash'],
                        'datetime': commit['datetime'],
                        'files_changed': files_changed,
                        'changes': changes
                    })
            except Exception as e:
                # Ignorer les erreurs et continuer
                pass
        
        if commit_stats:
            # Calculer des statistiques sur les changements
            total_changes = sum(c['changes'] for c in commit_stats)
            total_files = sum(c['files_changed'] for c in commit_stats)
            avg_changes = total_changes / len(commit_stats) if commit_stats else 0
            
            print_value("Total de lignes modifiées", total_changes, indent=2)
            print_value("Moyenne de lignes par commit", f"{avg_changes:.1f}", indent=2)
            print_value("Total de fichiers touchés", total_files, indent=2)
            print_value("Moyenne de fichiers par commit", f"{total_files/len(commit_stats):.1f}" if commit_stats else "0", indent=2)
            
            # Classifier les commits par taille
            small_commits = sum(1 for c in commit_stats if c['changes'] < 10)
            medium_commits = sum(1 for c in commit_stats if 10 <= c['changes'] < 100)
            large_commits = sum(1 for c in commit_stats if 100 <= c['changes'] < 500)
            huge_commits = sum(1 for c in commit_stats if c['changes'] >= 500)
            
            size_data = [
                ("Petits (<10)", small_commits),
                ("Moyens (<100)", medium_commits),
                ("Grands (<500)", large_commits),
                ("Énormes (500+)", huge_commits)
            ]
            
            if any(count > 0 for _, count in size_data):
                generate_chart(size_data, max(count for _, count in size_data), "Commits par taille (lignes modifiées)")
    
    # Recommandations
    if time_estimate['sessions_count'] > 5:
        print_subheader("RECOMMANDATIONS")
        
        # Analyser le rythme de travail
        avg_session_hours = time_estimate['total_hours'] / time_estimate['sessions_count'] if time_estimate['sessions_count'] > 0 else 0
        commits_per_day = len(commits) / project_days
        
        if avg_session_hours > 4:
            print_warning("Vos sessions de travail sont assez longues (moyenne > 4h). Pensez à faire des pauses régulières.", indent=2)
        
        if commits_per_day < 0.5 and project_days > 30:
            print_info("Votre rythme de commits est assez bas. Des commits plus fréquents pourraient améliorer le suivi de projet.", indent=2)
        
        # Déterminer les jours/heures de travail les plus productifs
        if day_dist and hour_dist:
            most_productive_day = max(day_dist.items(), key=lambda x: x[1])[0]
            most_productive_hour = max(hour_dist.items(), key=lambda x: x[1])[0]
            
            print_success(f"Votre jour le plus productif est le {days[most_productive_day]}.", indent=2)
            print_success(f"Votre heure la plus productive est {most_productive_hour}h.", indent=2)
    
    print_header("FIN DU RAPPORT")

def export_to_csv(filename, commits, sessions, time_estimate):
    """Exporte les résultats vers un fichier CSV."""
    import csv
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        # Exporter les informations des sessions
        writer = csv.writer(csvfile)
        writer.writerow(['Date', 'Heure', 'Durée (heures)', 'Nombre de commits', 'Premier message'])
        
        for session in time_estimate['session_details']:
            writer.writerow([
                session['start'].strftime('%Y-%m-%d'),
                session['start'].strftime('%H:%M'),
                f"{session['estimated_hours']:.2f}",
                session['commits'],
                session['start'].strftime('%Y-%m-%d %H:%M')
            ])
    
    # Créer un second fichier pour les commits détaillés
    commits_filename = filename.replace('.csv', '_commits.csv')
    if commits_filename == filename:
        commits_filename = filename + '_commits.csv'
    
    with open(commits_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Date', 'Heure', 'Auteur', 'Message', 'Hash'])
        
        for commit in commits:
            writer.writerow([
                commit['datetime'].strftime('%Y-%m-%d'),
                commit['datetime'].strftime('%H:%M:%S'),
                commit['author_name'],
                commit['message'],
                commit['hash'][:8]
            ])
    
    print_info(f"Données exportées vers {filename} et {commits_filename}")
def main():
    parser = argparse.ArgumentParser(description="Analyse le temps de travail sur un projet Git")
    parser.add_argument('--repo', '-r', default='.', help='Chemin vers le dépôt Git (par défaut: répertoire courant)')
    parser.add_argument('--author', '-a', help='Filtrer par auteur (ex: "John Doe" ou motif glob)')
    parser.add_argument('--since', '-s', help='Filtrer les commits depuis cette date (ex: "2023-01-01" ou "2 weeks ago")')
    parser.add_argument('--until', '-u', help='Filtrer les commits jusqu\'à cette date')
    parser.add_argument('--branch', '-b', help='Analyser seulement une branche spécifique')
    parser.add_argument('--threshold', '-t', type=float, default=3.0, 
                      help='Seuil en heures pour considérer une nouvelle session (par défaut: 3)')
    parser.add_argument('--verbose', '-v', action='store_true', 
                      help='Affiche des informations détaillées pendant l\'exécution')
    parser.add_argument('--detailed', '-d', action='store_true',
                      help='Génère un rapport plus détaillé avec graphiques et statistiques avancées')
    parser.add_argument('--no-color', action='store_true',
                      help='Désactive les couleurs dans le terminal')
    parser.add_argument('--quick', '-q', action='store_true',
                      help='Mode rapide: limite l\'analyse aux 1000 derniers commits')
    parser.add_argument('--export', '-e', 
                      help='Exporter les résultats vers un fichier CSV (spécifier le nom du fichier)')
    parser.add_argument('--version', action='version', version=f'GitInfos v{VERSION}')
    
    # Commandes rapides
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--last-week', action='store_true', help='Analyser la dernière semaine')
    group.add_argument('--last-month', action='store_true', help='Analyser le dernier mois')
    group.add_argument('--last-year', action='store_true', help='Analyser la dernière année')
    group.add_argument('--me', action='store_true', help='Analyser seulement vos propres commits')
    
    args = parser.parse_args()
    
    # Traiter les commandes rapides
    if args.last_week:
        args.since = "1 week ago"
    elif args.last_month:
        args.since = "1 month ago"
    elif args.last_year:
        args.since = "1 year ago"
    
    if args.me:
        try:
            # Essayer de récupérer l'utilisateur git configuré
            user_name = run_git_command('.', ['config', 'user.name'], False)
            user_email = run_git_command('.', ['config', 'user.email'], False)
            if user_name:
                args.author = user_name
        except:
            print_warning("Impossible de déterminer votre nom d'utilisateur Git. Utilisez --author manuellement.")
    
    # Mode rapide
    if args.quick:
        args.max_commits = 1000
    else:
        args.max_commits = None
    
    # Désactiver les couleurs si demandé ou si la sortie n'est pas un terminal
    if args.no_color or not sys.stdout.isatty():
        Colors.disable()
    
    repo_path = os.path.abspath(args.repo)
    verbose = args.verbose
    detailed = args.detailed
    
    # Démarrer le chronomètre pour mesurer le temps d'exécution
    start_time = time.time()
    
    # Afficher le banner ASCII art (rapidement en mode non-verbeux)
    print_banner(not verbose)
    
    if verbose:
        print(f"{Colors.BOLD}{Colors.GREEN}Analyseur de temps de travail Git - Mode verbeux{Colors.ENDC}")
        print(f"{Colors.CYAN}Chemin du dépôt: {Colors.BOLD}{repo_path}{Colors.ENDC}")
    
    if not is_git_repo(repo_path, verbose):
        print_error(f"Le répertoire {repo_path} n'est pas un dépôt Git valide.")
        sys.exit(1)
    
    # Récupérer des informations de base sur le dépôt
    repo_info = get_repo_info(repo_path, verbose)
    
    # Récupérer les commits
    try:
        commits = get_commits(repo_path, args.author, args.since, args.until, args.branch, verbose)
        
        if args.max_commits and len(commits) > args.max_commits:
            if verbose:
                print_warning(f"Limitation à {args.max_commits} commits (mode rapide activé)", indent=2)
            commits = commits[-args.max_commits:]  # Garder les plus récents
    except Exception as e:
        print_error(f"Erreur lors de la récupération des commits: {str(e)}")
        sys.exit(1)
    
    if not commits:
        print_warning("Aucun commit trouvé correspondant aux critères.")
        sys.exit(0)
    
    # Calculer les sessions et estimer le temps
    try:
        sessions = calculate_work_sessions(commits, args.threshold, verbose)
        time_estimate = estimate_work_time(sessions, verbose)
    except Exception as e:
        print_error(f"Erreur lors de l'analyse des commits: {str(e)}")
        sys.exit(1)
    
    # Afficher le rapport
    try:
        print_report(repo_path, repo_info, commits, sessions, time_estimate, 
                    args.author, args.since, args.until, args.branch, verbose, detailed)
    except Exception as e:
        print_error(f"Erreur lors de la génération du rapport: {str(e)}")
        sys.exit(1)
    
    # Exporter les résultats si demandé
    if args.export:
        try:
            export_to_csv(args.export, commits, sessions, time_estimate)
            print_success(f"Résultats exportés vers {args.export}")
        except Exception as e:
            print_error(f"Erreur lors de l'exportation: {str(e)}")
    
    # Afficher le temps d'exécution
    execution_time = time.time() - start_time
    print(f"\n{Colors.GREEN}Analyse terminée en {execution_time:.2f} secondes.{Colors.ENDC}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_error("\nInterruption par l'utilisateur. Arrêt du programme.")
        sys.exit(130)
    except Exception as e:
        print_error(f"Erreur inattendue: {str(e)}")
        if os.environ.get('GIT_INFOS_DEBUG'):
            import traceback
            traceback.print_exc()
        sys.exit(1)