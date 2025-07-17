-- Create table for default phases that can be edited by admins
CREATE TABLE public.default_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.default_phases ENABLE ROW LEVEL SECURITY;

-- RLS policies for default phases
CREATE POLICY "Anyone can view default phases" 
ON public.default_phases 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage default phases" 
ON public.default_phases 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));

-- Add trigger for updated_at
CREATE TRIGGER update_default_phases_updated_at
BEFORE UPDATE ON public.default_phases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing default phases data
INSERT INTO public.default_phases (name, checklist, display_order) VALUES 
('Bouwtekening', '["Indelingen: Badkamer, Slaapkamer, Wasruimte, Meterkast, Woonkamer, Keuken", "Installaties: WCD, afvoeren, waterleidingen, elektra, vloerverwarmingsverdelers, spotjes, deurbel, thermostaat, TV, UTP-kabel, ventilatiekanalen, afzuigkap (inbouw of opbouw)", "AI-indeling via styling"]'::jsonb, 1),
('Sloop / Strip', '["Vloeren, tegels en muren verwijderen", "Nieuwe indeling aanhouden", "Leidingen afdoppen", "WC en water werkend houden"]'::jsonb, 2),
('Styling & Opmeten', '["Alles opmeten", "Rekening houden met verhoogde vloeren, tegel/lijmdikte, verlaagd plafond", "Keukenmaten bepalen voor afvoer en water"]'::jsonb, 3),
('Uitbouw / Opbouw', '["Bouwkundige tekening", "Fundering", "Staalconstructie", "Balkon"]'::jsonb, 4),
('Indeling Ruwe Afbouw', '["Wanden van hout of gipsblokken plaatsen", "Isolatie aanbrengen", "Deuropeningen op standaardmaten houden"]'::jsonb, 5),
('Betonboren & Sleuven', '["Sleuven maken voor installaties", "Gaten boren voor afvoeren", "Alles gereed voor installatie"]'::jsonb, 6),
('Installaties', '["Elektrische installatie", "Waterleiding installatie", "Riolering", "Vloerverwarming", "Mechanische ventilatie", "Domotica", "Stofzuiger installatie"]'::jsonb, 7),
('Tegelwerk', '["Vloertegels", "Wandtegels", "Leggen volgens planning", "Voegen en afwerken"]'::jsonb, 8),
('Schilderwerk', '["Voorbehandelen", "Grondverf", "Eindverven muren en plafonds", "Houtwerk behandelen"]'::jsonb, 9),
('Afbouw', '["Plinten", "Binnendeuren plaatsen", "Deurbeslag monteren", "Afwerken details"]'::jsonb, 10),
('Keuken & Sanitair', '["Keuken plaatsen", "Aanrecht en werkblad", "Inbouwapparatuur", "Sanitair installeren", "Badkamermeubels"]'::jsonb, 11),
('Vloeren', '["Ondervloer voorbereiden", "Vloerbedekking leggen", "Afwerken en schoonmaken"]'::jsonb, 12),
('Elektra Afwerken', '["Schakelaars en stopcontacten", "Verlichting ophangen", "Domotica programmeren", "Testen en opleveren"]'::jsonb, 13),
('Oplevering', '["Laatste punten nalopen", "Schoonmaak", "Project mooi afronden", "Sleutels overdragen"]'::jsonb, 14);