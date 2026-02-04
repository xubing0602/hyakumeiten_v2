import pandas as pd

genre_mapping = {
    "定食": "食堂",
}

df = pd.read_csv("tabelog_hyakumeiten_output.csv")
df['award_selections_genre'] = df['award_selections'].str.split(' ').str[1]
df['award_selections_genre'] = df['award_selections_genre'].replace(genre_mapping)

# df[['award_selections', 'award_selections_genre']].head()
df.to_csv("tabelog_hyakumeiten_output.csv", index=False)
