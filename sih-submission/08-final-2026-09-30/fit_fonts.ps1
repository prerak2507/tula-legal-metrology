# Fits body text to the space each box has. Boxes of the same size on a slide form one group and get one scale,
# so rows and table columns stay even. Titles, section headings, the team badge and the footer are left alone.
param([string]$In, [string]$Out, [double]$Max = 1.15)
$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open($In, $true, $false, $false)

function Skip($sh) {
  if ($sh.Type -eq 14) { return $true }                               # template placeholders (slide titles)
  if (-not ($sh.HasTextFrame -and $sh.TextFrame.HasText)) { return $true }
  $t = $sh.TextFrame.TextRange.Text.Trim()
  if ($t -match '^Team' -or $t -match '^@SIH') { return $true }        # team badge, footer
  $sizes = @(); $tr0 = $sh.TextFrame.TextRange; $nr = $tr0.Runs().Count; for ($i = 1; $i -le $nr; $i++) { $sizes += $tr0.Runs($i).Font.Size }
  if (($sizes | Measure-Object -Maximum).Maximum -ge 14) { return $true }  # big numbers and display text
  # single-line section headings: all capitals, bold
  if ($t.Length -ge 6 -and -not ($t -cmatch '[a-z]') -and $sh.TextFrame.TextRange.Font.Bold -eq -1 -and $sh.TextFrame.TextRange.Paragraphs().Count -eq 1) { return $true }
  # headings and captions: one bold paragraph in a plain text box; step numbers in circles
  if ($sh.Type -eq 17 -and $sh.TextFrame.TextRange.Paragraphs().Count -eq 1 -and $sh.TextFrame.TextRange.Font.Bold -eq -1) { return $true }
  if ($t.Length -le 2) { return $true }
  return $false
}

function Fits($sh) {
  if ($sh.TextFrame.AutoSize -eq 1) { return $true }               # box grows with its text; overflow is checked on the render
  $tr = $sh.TextFrame.TextRange
  $m = $sh.TextFrame.MarginTop + $sh.TextFrame.MarginBottom
  return ($tr.BoundHeight -le ($sh.Height - [math]::Max(2, $m * 0.5))) -and ($tr.BoundWidth -le ($sh.Width + 0.5))
}

$report = @()
foreach ($s in $pres.Slides) {
  $groups = @{}
  foreach ($sh in $s.Shapes) {
    if (Skip $sh) { continue }
    $key = "{0}x{1}" -f [math]::Round($sh.Width / 4), [math]::Round($sh.Height / 4)
    if (-not $groups.ContainsKey($key)) { $groups[$key] = New-Object System.Collections.ArrayList }
    # remember each run's starting size
    $tr1 = $sh.TextFrame.TextRange; $nr = $tr1.Runs().Count; [System.Collections.Generic.List[double]]$base = New-Object 'System.Collections.Generic.List[double]'
    for ($i = 1; $i -le $nr; $i++) { $base.Add([double]$tr1.Runs($i).Font.Size) }
    [void]$groups[$key].Add(@{ Shape = $sh; Base = $base.ToArray() })
  }
  foreach ($key in $groups.Keys) {
    $items = $groups[$key]
    $chosen = $null
    foreach ($f in (@(1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85) | Where-Object { $_ -le $Max })) {
      foreach ($it in $items) {
        $tr2 = $it.Shape.TextFrame.TextRange; $nr = $tr2.Runs().Count
        for ($i = 1; $i -le $nr; $i++) {
          $b = [double]$it.Base[$i - 1]; $n = [double]([math]::Round($b * $f * 2) / 2)
          if ($b -lt 12 -and $n -gt 14) { $n = 14 }
          $tr2.Runs($i).Font.Size = $n
        }
      }
      $all = $true; foreach ($it in $items) { if (-not (Fits $it.Shape)) { $all = $false; break } }
      if ($all) { $chosen = $f; break }
    }
    if ($chosen -eq $null) { $chosen = 0.9 }
    $sample = $items[0].Shape.TextFrame.TextRange.Text.Trim()
    $report += "slide $($s.SlideIndex) x$chosen ($($items.Count) box) | $($sample.Substring(0, [math]::Min(38, $sample.Length)))"
  }
}
$pres.SaveAs($Out)
$pres.Close(); $pp.Quit()
$report
