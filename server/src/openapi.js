export function buildOpenApiSpec(baseUrl = 'http://localhost:4000') {
  return {
    openapi: '3.0.3',
    info: {
      title: 'BG Transport API',
      version: '1.0.0',
      description: 'API za aplikaciju gradskog prevoza u Beogradu'
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Vozac' },
      { name: 'Stanice' },
      { name: 'Linije' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['korisnickoIme', 'lozinka'],
          properties: {
            korisnickoIme: { type: 'string', example: 'marko' },
            lozinka: { type: 'string', example: 'test1234' }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['staraLozinka', 'novaLozinka', 'potvrdaLozinke'],
          properties: {
            staraLozinka: { type: 'string', example: 'stara123' },
            novaLozinka: { type: 'string', example: 'nova1234' },
            potvrdaLozinke: { type: 'string', example: 'nova1234' }
          }
        },
        DriverFirstChangePasswordRequest: {
          type: 'object',
          required: ['novaLozinka', 'potvrdaLozinke'],
          properties: {
            novaLozinka: { type: 'string', example: 'nova1234' },
            potvrdaLozinke: { type: 'string', example: 'nova1234' }
          }
        },
        CrowdStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['nema', 'mala', 'srednja', 'velika'] }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'API health',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      time: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registracija premium korisnika',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } }
            }
          },
          responses: {
            '201': { description: 'Korisnik registrovan' },
            '400': { description: 'Nevalidan unos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '409': { description: 'Korisnicko ime zauzeto' }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login premium korisnika',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } }
            }
          },
          responses: {
            '200': { description: 'Uspesan login' },
            '401': { description: 'Pogresni kredencijali' }
          }
        }
      },
      '/auth/promeni-lozinku': {
        post: {
          tags: ['Auth'],
          summary: 'Promena lozinke prijavljenog korisnika',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } }
            }
          },
          responses: {
            '200': { description: 'Lozinka promenjena' },
            '400': { description: 'Nevalidan zahtev' },
            '401': { description: 'Neispravna stara lozinka ili token' }
          }
        }
      },
      '/vozac/login': {
        post: {
          tags: ['Vozac'],
          summary: 'Login vozaca',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } }
            }
          },
          responses: {
            '200': { description: 'Uspesan login vozaca' },
            '401': { description: 'Pogresni kredencijali' }
          }
        }
      },
      '/vozac/moja-linija': {
        get: {
          tags: ['Vozac'],
          summary: 'Dohvatanje dodeljene linije vozaca za danas',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Dodeljena linija' },
            '403': { description: 'Potrebna promena lozinke' }
          }
        }
      },
      '/vozac/moja-linija/guzva': {
        post: {
          tags: ['Vozac'],
          summary: 'Upis statusa guzve za dodeljenu liniju vozaca',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CrowdStatusRequest' } }
            }
          },
          responses: {
            '200': { description: 'Status upisan' },
            '403': { description: 'Nema dozvolu za izabranu liniju' }
          }
        }
      },
      '/vozac/promeni-lozinku': {
        post: {
          tags: ['Vozac'],
          summary: 'Promena lozinke vozaca (prvi login flow)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/DriverFirstChangePasswordRequest' } }
            }
          },
          responses: {
            '200': { description: 'Lozinka promenjena i vracen novi token' },
            '400': { description: 'Nevalidan zahtev' }
          }
        }
      },
      '/stanice': {
        get: {
          tags: ['Stanice'],
          summary: 'Pretraga stanica',
          parameters: [
            {
              name: 'query',
              in: 'query',
              required: false,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Lista stanica' }
          }
        }
      },
      '/stanice/omiljene': {
        get: {
          tags: ['Stanice'],
          summary: 'Omiljene stanice premium korisnika',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Lista omiljenih stanica' },
            '403': { description: 'Samo premium korisnik' }
          }
        }
      },
      '/stanice/{id}': {
        get: {
          tags: ['Stanice'],
          summary: 'Dohvatanje stanice po ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Detalji stanice' },
            '404': { description: 'Stanica nije nadjena' }
          }
        }
      },
      '/stanice/{id}/linije': {
        get: {
          tags: ['Stanice'],
          summary: 'Linije koje prolaze kroz stanicu',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Lista linija' }
          }
        }
      },
      '/stanice/{id}/omiljena': {
        post: {
          tags: ['Stanice'],
          summary: 'Dodavanje stanice u omiljene',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Stanica dodata u omiljene' }
          }
        },
        delete: {
          tags: ['Stanice'],
          summary: 'Uklanjanje stanice iz omiljenih',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Stanica uklonjena iz omiljenih' }
          }
        }
      },
      '/linije': {
        get: {
          tags: ['Linije'],
          summary: 'Pretraga linija',
          parameters: [
            { name: 'query', in: 'query', required: false, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Lista linija' }
          }
        }
      },
      '/linije/{id}/trasa': {
        get: {
          tags: ['Linije'],
          summary: 'Dohvatanje trase linije',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'stationId', in: 'query', required: false, schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Trasa i stanice na trasi' }
          }
        }
      },
      '/linije/{id}/guzva': {
        get: {
          tags: ['Linije'],
          summary: 'Dohvatanje statusa guzve za liniju',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Status guzve' }
          }
        },
        post: {
          tags: ['Linije'],
          summary: 'Upis statusa guzve (vozac, samo dodeljena linija)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CrowdStatusRequest' } }
            }
          },
          responses: {
            '200': { description: 'Status upisan' },
            '403': { description: 'Nema dozvolu' }
          }
        }
      }
    }
  };
}

export function buildSwaggerUiHtml(specUrl = '/openapi.json') {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BG Transport API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui'
      });
    </script>
  </body>
</html>`;
}
