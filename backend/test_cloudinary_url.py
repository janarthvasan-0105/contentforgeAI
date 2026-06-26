import urllib.parse
cloud_name = "dx6zwxyuu"
base_public_id = "contentforge/base_template"
headline = "RentIt App"
subheadline = "The best rental app"

h = urllib.parse.quote_plus(headline)
s = urllib.parse.quote_plus(subheadline)

url = f"https://res.cloudinary.com/{cloud_name}/image/upload/l_text:Arial_64_bold:{h},co_rgb:FFFFFF,g_north,y_120/l_text:Arial_36:{s},co_rgb:FFFFFF,g_north,y_240/{base_public_id}.png"

print(url)
